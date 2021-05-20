import matplotlib.pyplot as plt
import torch
from ganpaint import renormalize, imgviz
import service.settings as settings
import pickle
import json
import glob
import base64
import os
from io import BytesIO
from sklearn.metrics import precision_recall_curve, auc
import numpy as np
import PIL
from Levenshtein import ratio

def apply_transform_to_mask(mask_image):
    mask_image_data = mask_image.replace('data:image/png;base64,', '') + "=="
    input_img = base64.b64decode(mask_image_data)
    with BytesIO(input_img) as img_buf:
        img_buf.seek(0)
        with PIL.Image.open(img_buf) as temp_img:
            width, height = temp_img.size
            if width == 224 and height == 224:
                return mask_image
            new_height = 256
            new_width = 256

            new_size = (new_width, new_height)
            # resize to 256X256
            new_img = temp_img.resize(new_size)  # upscale no blur
            crop_width = 224
            crop_height = 224
            left = (new_width - crop_width) / 2
            top = (new_height - crop_height) / 2
            right = (new_width + crop_width) / 2
            bottom = (new_height + crop_height) / 2
            # crop to 224 X 224
            new_img = new_img.crop((left, top, right, bottom))
            # save back to b64 image
            buffered_img = BytesIO()
            new_img.save(buffered_img, format="PNG")
            new_img_b64 = base64.b64encode(buffered_img.getvalue()).decode('ascii')
            return new_img_b64


def subspace_projection(u, vv):
    v_basis, _ = np.linalg.qr(torch.stack(vv, 1)) 
    v_basis = torch.Tensor(v_basis)
    
    return u - torch.matmul(v_basis, torch.matmul(v_basis.t(), u))


def derive_aspect_from_mask_annotations(
        importance_factor,
        f_sample_original,
        f_sample_test,
        annotations_original,
        annotation_test
):
    total_mask = 0.0
    total_feat = torch.zeros_like(f_sample_original[0, :, 0, 0])

    a = f_sample_test[annotation_test['id']]
    mask_image = annotation_test['b64_image']

    mask = renormalize.from_url(
        apply_transform_to_mask(mask_image),
        target='pt',
        size=a.shape[1:]
    )[0]

    total_feat = total_feat + (importance_factor * a * mask[None]).sum((1, 2))
    total_mask += mask.sum()

    for i, mask_image in [(x['id'], x['b64_image']) for x in annotations_original if not x.get('negative', False)]:
        a = f_sample_original[i]
        if mask_image:
            mask = renormalize.from_url(
                apply_transform_to_mask(mask_image), target='pt', size=a.shape[1:])[0]
            total_feat = total_feat + (a * mask[None]).sum((1, 2))
            total_mask += mask.sum()

    feat = total_feat / (total_mask + 1e-20)

    negative_feat = torch.zeros_like(f_sample_original[0, :, 0, 0])
    negative_feat_array = []
    for i, mask_image in [(x['id'], x['b64_image']) for x in annotations_original if x.get('negative', False)]:
        a = f_sample_original[i]
        if mask_image:
            mask = renormalize.from_url(
                apply_transform_to_mask(mask_image), target='pt', size=a.shape[1:])[0]
            negative_feat = (a * mask[None]).sum((1, 2))
            negative_feat_array.append(negative_feat / (mask.sum() + 1e-20))

    if(len(negative_feat_array) > 0):
        feat = subspace_projection(feat, negative_feat_array)

    return feat


def get_score(aspect, f_sample):
    patch_scores = (f_sample * aspect[None, :, None, None]).sum(1)
    score = patch_scores.view(len(f_sample), -1).max(1)[0]
    return score


# A simple hook class that returns the input and output of a layer during forward/backward pass
class Hook(object):
    def __init__(self, module, backward=False):
        if backward==False:
            self.hook = module.register_forward_hook(self.hook_fn)
        else:
            self.hook = module.register_backward_hook(self.hook_fn)

    def hook_fn(self, module, input, output):
        self.input = input
        self.output = output

    def close(self):
        self.hook.remove()


class MyLinearModel(torch.nn.Module):
    def __init__(self, n):
        super(MyLinearModel, self).__init__()
        self.linear = torch.nn.Linear(n, n)
        self.activation = torch.nn.ReLU()
        self.linear2 = torch.nn.Linear(n, 1, bias=False)

    def forward(self, X):
        X = self.linear(X)
        X = self.activation(X)
        X = self.linear2(X)
        return X


def find_parameters_methodA(aspects, f_sample_original, f_sample_test):
    aspect_scores_test = []
    for aspect in aspects:
        aspect_scores_test.append(get_score(aspect, f_sample_test).item())

    aspect_scores_original = []
    for aspect in aspects:
        aspect_scores_original.append(get_score(aspect, f_sample_original))

    aspect_scores_original_mean = [x.mean().item() for x in aspect_scores_original]

    weights = [(1/(len(aspect_scores_test)*x)) for x in aspect_scores_test]

    bias = [-x*y for x, y in zip(weights, aspect_scores_original_mean)]

    model = MyLinearModel(len(aspects))
    model.linear.weight.data = torch.diag(torch.Tensor(weights))
    model.linear.bias.data = torch.Tensor(bias)
    model.linear2.weight.data = torch.Tensor([1] * len(aspects))

    return model


def evaulate_methodA(aspects, model, f_sample_original, f_sample_test):
    score_layer = Hook(model.activation)

    X = torch.cat([get_score(aspect, f_sample_test)[:, None] for aspect in aspects], 1)
    with torch.no_grad():
        test_final_scores = model(X)
    aspect_scores_test = score_layer.output.detach().cpu()
    X = torch.cat([get_score(aspect, f_sample_original)[:, None] for aspect in aspects], 1)
    with torch.no_grad():
        original_final_scores = model(X)
    aspect_scores_original = score_layer.output.detach().cpu()
    test_final_scores = test_final_scores.tolist()
    original_final_scores = original_final_scores.tolist()
    y_true = [1] * len(test_final_scores) + [0] * len(original_final_scores)
    y_scores = test_final_scores + original_final_scores

    precision, recall, _ = precision_recall_curve(y_true, y_scores)
    auc_ = auc(recall, precision)

    tp = [int(r * len(test_final_scores)) for r in recall]
    fp = [int(tp/(pr + 1e-20)) - tp for pr, tp in zip(precision, tp)]

    recall_diff = np.diff(recall)
    retain_mask = np.abs(recall_diff) > 0.001
    retain_mask = [False] + retain_mask
    precision = [x for x, y in zip(precision, retain_mask) if y]
    recall = [x for x, y in zip(recall, retain_mask) if y]
    tp = [x for x, y in zip(tp, retain_mask) if y]
    fp = [x for x, y in zip(fp, retain_mask) if y]

    return precision, recall, auc_, tp, fp


def find_parameters_methodB(aspects, f_sample_original, f_sample_test):
    aspect_scores_test = []
    for aspect in aspects:
        aspect_scores_test.append(get_score(aspect, f_sample_test).item())

    aspect_scores_original = []
    for aspect in aspects:
        aspect_scores_original.append(get_score(aspect, f_sample_original))

    aspect_scores_original_mean = [x.mean().item() for x in aspect_scores_original]
    stds = [x.std() for x in aspect_scores_original]

    weights = [(1 / y) for y in stds]

    bias = [-x*y for x, y in zip(weights, aspect_scores_original_mean)]

    model = MyLinearModel(len(aspects))
    model.linear.weight.data = torch.diag(torch.Tensor(weights))
    model.linear.bias.data = torch.Tensor(bias)
    model.linear2.weight.data = torch.Tensor([1] * len(aspects))

    score_layer = Hook(model.activation)
    with torch.no_grad():
        model(torch.cat([x[:, None] for x in aspect_scores_original], 1))
    original_aspect_scores = score_layer.output.detach().cpu()
    model.linear2.weight.data = 1. / original_aspect_scores.std(0)
    return model


def score_annotations(
        importance_factor,
        annotations,
        fit_func,
        evaluate_func,
        f_sample_original,
        f_sample_test,
        image_labels_test
):
    test_index = annotations['id']
    class_mask = image_labels_test == image_labels_test[test_index]

    f_sample_test_single_class = f_sample_test[class_mask]

    aspects = []
    for _, aspect_data in annotations['aspects'].items():
        aspects.append(
            derive_aspect_from_mask_annotations(
                importance_factor,
                f_sample_original,
                f_sample_test,
                aspect_data['data'][1:],
                aspect_data['data'][0]
            )
        )
    parameters = fit_func(
        aspects,
        f_sample_original,
        f_sample_test[None, test_index]
    )
    return evaluate_func(
        aspects,
        parameters,
        f_sample_original,
        f_sample_test_single_class
    )


class ExamplesByPaint(object):

    def __init__(self, f_whitened_original_path, f_whitened_test_path, image_labels_test_path,
                 classnames_test_path, img_sample_original_path, img_sample_test_path, img_mapping_original_path, img_mapping_test_path):
        with open(f_whitened_original_path, 'rb') as f_whitened_original_file:
            self.f_whitened_original = pickle.load(f_whitened_original_file)
        with open(f_whitened_test_path, 'rb') as f_whitened_test_file:
            self.f_whitened_test = pickle.load(f_whitened_test_file)
        with open(image_labels_test_path, 'rb') as image_labels_test_file:
            self.image_labels_test = pickle.load(image_labels_test_file)
        with open(classnames_test_path, 'rb') as classnames_test_file:
            self.classnames_test = pickle.load(classnames_test_file)
        with open(img_sample_original_path, 'rb') as img_sample_original_file:
            self.img_sample_original = pickle.load(img_sample_original_file)
        with open(img_mapping_original_path, 'rb') as img_mapping_original_file:
            self.img_mapping_original = pickle.load(img_mapping_original_file)
        with open(img_sample_test_path, 'rb') as img_sample_test_file:
            self.img_sample_test = pickle.load(img_sample_test_file)
        with open(img_mapping_test_path, 'rb') as img_mapping_test_file:
            self.img_mapping_test = pickle.load(img_mapping_test_file)
        self.reverse_img_mapping_test = {v: k for k, v in self.img_mapping_test.items()}


    def recover_images_by_class(self, query_str):
        classnames = self.classnames_test
        image_labels = self.image_labels_test 
        reverse_img_mapping = self.reverse_img_mapping_test
        scores = list(map(lambda x: ratio(query_str, x), classnames))
        arg = np.argmax(scores)

        indices = []
        classname = None
        if scores[arg] > 0:
            indices = [x for x, y in zip(range(len(image_labels)), (image_labels == arg).tolist()) if y]
            classname = classnames[arg]

        return_val = []
        for index in indices:
            return_val.append(
                {
                    'id': index,
                    'name': classname,
                    'image_path': reverse_img_mapping[index],
                    'score': 0,
                    'b64_image': '',
                    'in_aspect': False,
                    'include': True
                }
            )
        return return_val

    def get_demo_scores(self, annotations_json):
        precision, recall, auc_, tp, fp = score_annotations(
            5.,
            annotations_json,
            find_parameters_methodB,
            evaulate_methodA,
            self.f_whitened_original,
            self.f_whitened_test,
            self.image_labels_test
        )

        score = {'id': annotations_json['id'], 'recall': recall, 'precision': precision,
                 'auc': auc_.tolist(), 'tp': tp, 'fp': fp}
        return score

    def get_feature_images(self, query_heatmaps_json):
        """
            query_heatmaps = [ { "id":<integer id>; "b64_image": <b64 encoded png string> }, {...}, {...} ]
        """
        max_results = settings.results_shown
        if "max_results" in query_heatmaps_json:
            max_results = query_heatmaps_json["max_results"]
        total_mask = 0.0
        total_feat = torch.zeros_like(self.f_whitened_original[0,:,0,0])

        a = self.f_whitened_test[query_heatmaps_json['images'][0]['id']]
        mask_image = query_heatmaps_json['images'][0]['b64_image']

        mask = renormalize.from_url(
            apply_transform_to_mask(mask_image),
            target='pt',
            size=a.shape[1:]
        )[0]

        total_feat = total_feat + (a * mask[None]).sum((1, 2))
        total_mask += mask.sum()

        for i, mask_image in [(x['id'], x['b64_image']) for x in query_heatmaps_json['images'][1:] if not x.get('negative', False)]:
            a = self.f_whitened_original[i]
            if mask_image:
                mask = renormalize.from_url(
                    apply_transform_to_mask(mask_image), target='pt', size=a.shape[1:])[0]
                total_feat = total_feat + (a * mask[None]).sum((1,2))
                total_mask += mask.sum()
        feat = total_feat / (total_mask + 1e-20)

        negative_feat = torch.zeros_like(self.f_whitened_original[0, :, 0, 0])
        negative_feat_array = []
        for i, mask_image in [(x['id'], x['b64_image']) for x in query_heatmaps_json['images'][1:] if x.get('negative', False)]:
            a = self.f_whitened_original[i]
            if mask_image:
                mask = renormalize.from_url(
                    apply_transform_to_mask(mask_image), target='pt', size=a.shape[1:])[0]
                negative_feat = (a * mask[None]).sum((1, 2))
                negative_feat_array.append(negative_feat / (mask.sum() + 1e-20))

        if(len(negative_feat_array) > 0):
            feat = subspace_projection(feat, negative_feat_array)

        # Rank the sampled images according to similar to this feature
        patch_scores = (self.f_whitened_original * feat[None,:,None,None]).sum(1)
        score = patch_scores.view(len(self.f_whitened_original), -1).max(1)[0]
        _, ordering = torch.sort(-score)
        iv = imgviz.ImageVisualizer(128)
        result_heatmaps = [
            (
                i,
                iv.masked_image(
                    self.img_sample_original[i],
                    (self.f_whitened_original[i] * feat[None,:,None,None]).sum(1)[0],
                    percent_level=0.9
                )
            )
            for i in ordering[:max_results]
        ]

        map_keys_original = list(self.img_mapping_original.keys())
        map_values_original = list(self.img_mapping_original.values())

        # build output json
        result_heatmaps_json = []
        for i, image in result_heatmaps:
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode('ascii')
            img_map = map_keys_original[map_values_original.index(int(i))]
            img_map = img_map.replace('\\', '/').replace('_original', '')
            acft_name = os.path.basename(os.path.dirname(img_map))
            result_heatmaps_json.append({'id': int(i), 'name': acft_name, 'b64_image': img_str, 'image_path': img_map})

        return result_heatmaps_json


def run_tests():
    f_whitened_original = pickle.load(open(settings.data_path + "f_whitened_original.pkl", 'rb'))
    f_whitened_test = pickle.load(open(settings.data_path + "f_whitened_test.pkl", 'rb'))
    classnames_test = pickle.load(open(settings.data_path + "classnames_test.pkl", 'rb'))
    image_labels_test = pickle.load(open(settings.data_path + "image_labels_test.pkl", 'rb'))
    # img_sample_original = pickle.load(open(settings.data_path + "img_sample_original.pkl", 'rb'))
    # img_sample_test = pickle.load(open(settings.data_path + "img_sample_test.pkl", 'rb'))
    # classnames_original = pickle.load(open(settings.data_path + "classnames_original.pkl", 'rb'))
    # image_labels_original = pickle.load(open(settings.data_path + "image_labels_original.pkl", 'rb'))
    test_annotations = [json.load(open(x, 'r')) for x in glob.glob(settings.data_path + "annotations" + '/*.json')]
    for annotations in test_annotations:
        test_index = annotations['id']
        test_classname = classnames_test[image_labels_test[test_index]]
        precision, recall, auc_, _, _ = score_annotations(
            30.,
            annotations,
            find_parameters_methodB,
            evaulate_methodA,
            f_whitened_original,
            f_whitened_test,
            image_labels_test
        )
        plt.figure()
        plt.plot(recall, precision)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title(f'ID: {annotations["id"]} Class: {test_classname} AUC: {auc_:.3f}')

    plt.show()


if __name__ == '__main__':
    run_tests()
