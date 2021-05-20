#%matplotlib inline
#%config InlineBackend.figure_format = 'retina'
import matplotlib.pyplot as plt
import numpy as np
import sys
import argparse
from .oneshot_places365 import compute_statistics
from ganpaint import renormalize, imgviz
import service.settings as settings

import json
import pickle
import base64
from io import BytesIO
import torch
import os
from PIL import Image

new_classes_datadir = settings.data_path + 'event_img/'

original_classes_datadir = settings.data_path + 'val/'

# preextracted_data_path = settings.data_path + 'sun397_features.npz'

model_path = settings.data_path + 'places.365.resnet18.pth'

number_of_results = settings.results_shown


def parse_args(argv):
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('--weights_file', required=True)
    parser.add_argument('--new_class', required=True)
    parser.add_argument('--unit_json', required=True)

    # weights file
    # positive_list
    # negative_list
    return parser.parse_args(argv)


def simple_weight_rerank(weight_matrix, unit_dict):
    weight_matrix_new = np.copy(weight_matrix)
    W_class_sorted = sorted(weight_matrix_new[365, :], reverse=True)
    # plt.plot(range(512), W_class_sorted)
    # plt.axhline(linewidth=4, color='r')
    # plt.show()
    for unit in unit_dict['units']:
        weight_matrix_new[365, unit['unit']] = W_class_sorted[unit['index']]    
    return weight_matrix_new

def activations_rerank_1(weight_matrix, unit_dict):
    weight_matrix_new = np.copy(weight_matrix)
    W_class_sorted_w_index = sorted(zip(weight_matrix_new[365, :], range(512)), reverse=True)
    W_class_sorted = [x for x, _ in W_class_sorted_w_index]
    W_class_sorted_indices = [y for _, y in W_class_sorted_w_index]
    unedited_list = [x for x in W_class_sorted_indices if x not in [unit['unit'] for unit in unit_dict['units'][:20]]]
    resorted_list = [unit['unit'] for unit in unit_dict['units'][:20]] + unedited_list
    plt.plot(range(512), W_class_sorted)
    plt.axhline(linewidth=4, color='r')
    plt.show()
    for i, unit in enumerate(resorted_list):
        weight_matrix_new[365, unit] = W_class_sorted[i]  
    plt.plot(range(512), sorted(weight_matrix_new[365, :], reverse=True))
    plt.plot(range(512), sorted(W_class_sorted, reverse=True)) 
    plt.show() 
    return weight_matrix_new

def send_all_weights_to_high_value(weight_matrix, unit_dict):
    weight_matrix_new = np.copy(weight_matrix)
    W_class_sorted = sorted(weight_matrix_new[365, :], reverse=True)
    for unit in unit_dict['units']:
        weight_matrix_new[365, unit['unit']] = 100000000.    
    return weight_matrix_new


def get_scores(class_name, unit_json, classifier_path, preextracted_data_path):

    """
    This program applies the changed unit.json files to the oneshot
    classifier and rescores on the entire dataset.

    """

    preextracted_data = np.load(preextracted_data_path)
    
    original_classnames = preextracted_data['original_classnames']
    original_labels = preextracted_data['original_labels']
    original_features = preextracted_data['original_feature']

    new_classnames = preextracted_data['new_classnames']
    new_classes_labels = preextracted_data['new_classes_labels']
    new_classes_features = preextracted_data['new_classes_features']

    weight_matrix = np.load(classifier_path)['arr_0']
    new_class = class_name
    unit_dict = unit_json  # json.load(open(json_path, 'r'))

    gt_label = list(new_classnames).index(new_class)
        
    y_truth_arr = np.array(new_classes_labels)

    # Score before
    acc_on_whole_set_before, p_new_before, r_new_before, f1_new_before, acc_on_new_class_before, pg_before, rg_before = compute_statistics(
        weight_matrix,
        gt_label,
        y_truth_arr,
        new_classes_features,
        original_labels,
        original_features
    )

    #intervention = send_all_weights_to_high_value
    intervention = simple_weight_rerank
    #intervention = activations_rerank_1

    weight_matrix = intervention(weight_matrix, unit_dict)

    # Score after
    acc_on_whole_set_after, p_new_after, r_new_after, f1_new_after, acc_on_new_class_after, pg_after, rg_after = compute_statistics(
        weight_matrix,
        gt_label,
        y_truth_arr,
        new_classes_features,
        original_labels,
        original_features
    )
    #print(f'Accuracy before: {acc_on_whole_set_before}')
    #print(f'Accuracy after: {acc_on_whole_set_after}')
    #print(f'New Class F1 before: {f1_new_before}')
    #print(f'New Class F1 after: {f1_new_after}')

    scores = {
              "accuracy_before": acc_on_whole_set_before,
              "accuracy_after": acc_on_whole_set_after,
              "f1_before": f1_new_before,
              "f1_after": f1_new_after
              }
    return scores

class ExamplesByPaint(object):
    
    def __init__(self, f_sample_path, img_sample_path, img_mapping_path):
        with open(f_sample_path, 'rb') as f_sample_file:
            self.f_sample = pickle.load(f_sample_file)
        with open(img_sample_path, 'rb') as img_sample_file:
            self.img_sample = pickle.load(img_sample_file)
        with open(img_mapping_path, 'rb') as img_mapping_file:
            self.img_mapping = pickle.load(img_mapping_file)
    
    def get_feature_images(self, query_heatmaps_json):
        """
            query_heatmaps = [ { "id":<integer id>; "b64_image": <b64 encoded png string> }, {...}, {...} ]
        """
        
        total_mask = 0.0
        total_feat = torch.zeros_like(self.f_sample[0,:,0,0])
        for i, mask_image in [(x['id'], x['b64_image']) for x in query_heatmaps_json['images']]:
            a = self.f_sample[i]
            if mask_image:
                """
                # Rescale and crop image - TODO: make sure this is correct
                # print(mask_image)
                mask_image_data = mask_image.replace('data:image/png;base64,', '') + "=="
                input_img = base64.b64decode(mask_image_data)  
                with BytesIO(input_img) as img_buf:
                    img_buf.seek(0)
                    with Image.open(img_buf) as temp_img:
                        width, height = temp_img.size
                        new_width = 256
                        print(width, height)
                        new_size = (new_width, height)
                        # resize to 256XH
                        new_img = temp_img.resize(new_size)  # upscale no blur
                        crop_width = 256
                        crop_height = 256
                        left = (width - crop_width)/2
                        top = (height - crop_height)/2
                        right = (width + crop_width)/2
                        bottom = (height + crop_height)/2
                        # crop to 256 X 256
                        # new_img = new_img.crop((left, top, right, bottom))
                        # save back to b64 image
                        buffered_img = BytesIO()
                        new_img.save(buffered_img, format="PNG")
                        new_img_b64 = base64.b64encode(buffered_img.getvalue()).decode('ascii')
                        mask_image = new_img_b64
                """
                mask = renormalize.from_url(
                    mask_image, target='pt', size=a.shape[1:])[0]
                total_feat = total_feat + (a * mask[None]).sum((1,2))
                total_mask += mask.sum()
        feat = total_feat / (total_mask + 1e-20)
        
        # Rank the sampled images according to similar to this feature
        patch_scores = (self.f_sample * feat[None,:,None,None]).sum(1)
        score = patch_scores.view(len(self.f_sample), -1).max(1)[0]
        _, ordering = torch.sort(-score)
        iv = imgviz.ImageVisualizer(128)
        result_heatmaps = [
            (
                i,
                iv.masked_image(
                    self.img_sample[i],
                    (self.f_sample[i] * feat[None,:,None,None]).sum(1)[0],
                    percent_level=0.9
                )
            )
            for i in ordering[:number_of_results]
        ]

        map_keys = list(self.img_mapping.keys())
        map_values = list(self.img_mapping.values())

        # build output json
        result_heatmaps_json = []
        for i, image in result_heatmaps:
            buffered = BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode('ascii')
            img_map = map_keys[map_values.index(int(i))]
            img_map = img_map.replace('\\', '/')
            acft_name = os.path.basename(os.path.dirname(img_map))
            result_heatmaps_json.append({'id': int(i), 'name': acft_name, 'b64_image': img_str, 'image_path': img_map})

        return result_heatmaps_json
    

