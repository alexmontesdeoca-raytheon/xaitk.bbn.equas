from utilitiesService.ganpaint import renormalize, imgviz, nethook, pbar, parallelfolder
from torch.utils.data import DataLoader
from utilitiesService.ganpaint import runningstats
import torch, torchvision
import pickle
import sys

max_rec = 0x100000
sys.setrecursionlimit(max_rec)
torch.backends.cudnn.benchmark = True
torch.set_grad_enabled(False)

# model_path = settings.data_path + 'model_best.pth.tar'
# aircraft_data_path = settings.data_path + 'aircraft_data'
data_path = '../../../evaluation_dataset/one_shot_data/'
model_path = data_path + 'model_best.pth.tar'
aircraft_data_path_original = data_path + 'aircraft_data_original'
aircraft_data_path_test = data_path + 'aircraft_data_test'


class VGG16(torch.nn.Module):

    def __init__(self, num_classes):
        super().__init__()
        self.model = torchvision.models.vgg16(num_classes=num_classes)

        self.model.avgpool = torch.nn.AdaptiveAvgPool2d(1)

        self.model.classifier = torch.nn.Sequential(
            torch.nn.Dropout(),
            torch.nn.Linear(512, self.model.classifier[-1].out_features, bias=True)
        )

    def forward(self, x):
        return self.model(x)


def vgg16_gap_upstream(*args, num_classes=1000, **kwargs):
    model = VGG16(num_classes)

    return model

model = vgg16_gap_upstream(num_classes=90)
model.load_state_dict(torch.load(model_path)['state_dict'])
net = nethook.InstrumentedModel(model).cuda()
net.eval()
net.retain_layer('model.features.29')

def load_image_set(dataset, size=10000):
    # Equivalent: img_sample = torch.cat([dataset[i][0][None] for i in pbar(range(10000))])
    # Batching reads with DataLoader helps us do multithreaded disk access.
    load_batch_size = 1000
    img_sample = torch.cat([batch[0] for batch, i in zip(
        # To run on cpu switch to num_workers=0
        DataLoader(dataset, batch_size=load_batch_size, num_workers=20),
        pbar(range(-(-size // load_batch_size))))])[:size]
    img_labels = torch.cat([label for (batch_data, label), i in zip(
        # To run on cpu switch to num_workers=0
        DataLoader(dataset, batch_size=load_batch_size, num_workers=20),
        pbar(range(-(-size // load_batch_size))))])[:size]
    return img_sample, img_labels


def create_feature_set(feature_fn, img_sample):
    compute_batch_size = 32
    f_sample = torch.cat([
        feature_fn(img_sample[i:i + compute_batch_size])
        for i in pbar(range(0, len(img_sample), compute_batch_size))])
    return f_sample


def feature_fn(img_batch):
    # net(img_batch)
    # return net.retained_layer('model.features.29').cpu()
    # Switch 2 lines below to the two lines above to run on cpu
    net(img_batch.cuda())
    return net.retained_layer('model.features.29').cpu()


def feature_unit_heatmap(feature_fn, dataset, image_number=0, unit_number=0):
    # return iv.heatmap(feature_fn(dataset[image_number][0][None])[0, unit_number])
    # Switch the line below to the line above to run on cpu
    return iv.heatmap(feature_fn(dataset[image_number][0][None].cuda())[0, unit_number])


def feature_whiten(f_samples):
    print("Collecting covariance of the features")
    cv = runningstats.RunningCovariance()
    for f_sample in f_samples:
        cv.add(f_sample.permute(0, 2, 3, 1).contiguous().view(-1, f_sample.shape[1]))

    print("Creating whitened version of features")
    whitener = cv.covariance().inverse()
    def whiten(data):
        return torch.matmul(data.permute(0,2,3,1), whitener).permute(0,3,1,2)
    f_whitened =[]
    for f_sample in f_samples:
        f_whitened.append(whiten(f_sample))
    return f_whitened


def preprocess():

    


    g_transform = torchvision.transforms.Compose([
        torchvision.transforms.Resize((256, 256)),
        torchvision.transforms.CenterCrop(224),
        torchvision.transforms.ToTensor(),
        torchvision.transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))])

    ds_original = parallelfolder.ParallelImageFolders(
        [aircraft_data_path_original],
        transform=g_transform,
        classification=True,
        shuffle=False
    )
    ds_test = parallelfolder.ParallelImageFolders(
        [aircraft_data_path_test],
        transform=g_transform,
        classification=True,
        shuffle=False
    )

    print("Loading a sample of images")
    img_sample_original, img_labels_original = load_image_set(ds_original)
    img_sample_test, img_labels_test = load_image_set(ds_test)
    classnames_original = ds_original.classes
    classnames_test = ds_test.classes

    print("Building a tensor of all features over images")
    f_sample_original = create_feature_set(feature_fn, img_sample_original)
    f_sample_test = create_feature_set(feature_fn, img_sample_test)

    f_whitened_original, f_whitened_test = feature_whiten([f_sample_original, f_sample_test])

    print("Creating Image ID Map")

    path2datasetidx_original = dict()
    for i, path in enumerate(ds_original.images):
        path2datasetidx_original[path[0]] = i
    
    path2datasetidx_test = dict()
    for i, path in enumerate(ds_test.images):
        path2datasetidx_test[path[0]] = i

    print('caching necessary variables')
    pkl_path = data_path
    max_rec = 0x100000
    sys.setrecursionlimit(max_rec)
    with open(pkl_path + 'img_sample_original.pkl', 'wb') as pkl_is_output:
        pickle.dump(img_sample_original, pkl_is_output, protocol=4)

    with open(pkl_path + 'img_sample_test.pkl', 'wb') as pkl_is_output:
        pickle.dump(img_sample_test, pkl_is_output, protocol=4)

    with open(pkl_path + 'f_whitened_original.pkl', 'wb') as pkl_fw_output:
        pickle.dump(f_whitened_original, pkl_fw_output, protocol=4)
    
    with open(pkl_path + 'f_whitened_test.pkl', 'wb') as pkl_fw_output:
        pickle.dump(f_whitened_test, pkl_fw_output, protocol=4)

    with open(pkl_path + 'image_mapping_original.pkl', 'wb') as pkl_im_output:
        pickle.dump(path2datasetidx_original, pkl_im_output, protocol=4)
    
    with open(pkl_path + 'image_mapping_test.pkl', 'wb') as pkl_im_output:
        pickle.dump(path2datasetidx_test, pkl_im_output, protocol=4)

    with open(pkl_path + 'image_labels_original.pkl', 'wb') as pkl_l_output:
        pickle.dump(img_labels_original, pkl_l_output, protocol=4)
    
    with open(pkl_path + 'image_labels_test.pkl', 'wb') as pkl_l_output:
        pickle.dump(img_labels_test, pkl_l_output, protocol=4)

    with open(pkl_path + 'classnames_original.pkl', 'wb') as pkl_cn_output:
        pickle.dump(classnames_original, pkl_cn_output, protocol=4)
    
    with open(pkl_path + 'classnames_test.pkl', 'wb') as pkl_cn_output:
        pickle.dump(classnames_test, pkl_cn_output, protocol=4)

    print(path2datasetidx_original)
    print(path2datasetidx_test)
    print(classnames_original)
    print(classnames_test)
    print('done')


if __name__ == '__main__':
    preprocess()
