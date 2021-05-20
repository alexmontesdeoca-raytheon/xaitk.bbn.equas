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
aircraft_data_path = data_path + 'aircraft_data'


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
#model.load_state_dict(torch.load(model_path, map_location=torch.device("cpu"))['state_dict'])
#net = nethook.InstrumentedModel(model)
# Switch 2 lines below to the two lines above to run on cpu
model.load_state_dict(torch.load(model_path)['state_dict'])
net = nethook.InstrumentedModel(model).cuda()
net.eval()
net.retain_layer('model.features.29')

g_transform = torchvision.transforms.Compose([
    torchvision.transforms.Resize((256, 256)),
    torchvision.transforms.CenterCrop(224),
    torchvision.transforms.ToTensor(),
    torchvision.transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))])

ds = parallelfolder.ParallelImageFolders(
    [aircraft_data_path],
    transform=g_transform,
    shuffle=True)

iv = imgviz.ImageVisualizer(128)
iv.image(ds[88][0])


def load_image_set(dataset, size=10000):
    # Equivalent: img_sample = torch.cat([dataset[i][0][None] for i in pbar(range(10000))])
    # Batching reads with DataLoader helps us do multithreaded disk access.
    load_batch_size = 1000
    img_sample = torch.cat([batch[0] for batch, i in zip(
        # To run on cpu switch to num_workers=0
        DataLoader(dataset, batch_size=load_batch_size, num_workers=20),
        pbar(range(-(-size // load_batch_size))))])[:size]
    return img_sample


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


def preprocess():

    net.retain_layer('model.features.29')

    print("Loading a sample of images")
    img_sample = load_image_set(ds)

    print("Building a tensor of all features over images")
    f_sample = create_feature_set(feature_fn, img_sample)

    print("Collecting covariance of the features")
    cv = runningstats.RunningCovariance()
    cv.add(f_sample.permute(0, 2, 3, 1).contiguous().view(-1, f_sample.shape[1]))

    print("Creating whitened version of features")
    whitener = cv.covariance().inverse()

    print("Creating Image ID Map")
    path2datasetidx = dict()
    for i, path in enumerate(ds.images):
        path2datasetidx[path[0]] = i

    def whiten(data):
        return torch.matmul(data.permute(0, 2, 3, 1), whitener).permute(0, 3, 1, 2)

    f_whitened = whiten(f_sample)

    print('caching necessary variables')
    pkl_path = data_path
    max_rec = 0x100000
    sys.setrecursionlimit(max_rec)
    with open(pkl_path + 'img_sample.pkl', 'wb') as pkl_is_output:
        pickle.dump(img_sample, pkl_is_output, protocol=4)

    with open(pkl_path + 'f_whitened.pkl', 'wb') as pkl_fw_output:
        pickle.dump(f_whitened, pkl_fw_output, protocol=4)

    with open(pkl_path + 'image_mapping.pkl', 'wb') as pkl_im_output:
        pickle.dump(path2datasetidx, pkl_im_output, protocol=4)

    print(path2datasetidx)
    print('done')


if __name__ == '__main__':
    preprocess()
