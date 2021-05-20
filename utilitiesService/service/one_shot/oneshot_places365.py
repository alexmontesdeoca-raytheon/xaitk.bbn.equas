#%matplotlib inline
#%config InlineBackend.figure_format = 'retina'
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch import optim
import torch.nn.functional as F
import torchvision
from torchvision import datasets, transforms, models
from torch.optim import lr_scheduler
import matplotlib.pyplot as plt
import time
import copy
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, precision_recall_fscore_support, auc, precision_recall_curve
import sys
import os
from collections import Counter
import math
import random
from PIL import Image
from torch.autograd import Variable
import pandas
import scipy
from prg import prg

transforms_ = transforms.Compose(
    [
        transforms.Resize((255)),
        #transforms.Resize((227,227)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406], 
            std=[0.229, 0.224, 0.225]
        )
    ]
)

one_shot_examples = {
    'badminton': '/evaluation_dataset/one_shot_data/event_img/badminton/Easy_Mid_badminton_98.jpg',
    'bocce': '/evaluation_dataset/one_shot_data/event_img/bocce/Medium_Mid_bocce_78.jpg',
    'croquet': '/evaluation_dataset/one_shot_data/event_img/croquet/Easy_Mid_croquet_2.jpg',
    'polo': '/evaluation_dataset/one_shot_data/event_img/polo/Easy_Mid_polo_96.jpg',
    'RockClimbing': '/evaluation_dataset/one_shot_data/event_img/RockClimbing/Easy_Mid_RockClimbing_90.jpg',
    'rowing': '/evaluation_dataset/one_shot_data/event_img/rowing/Easy_Mid_Rowing_5.jpg',
    'sailing': '/evaluation_dataset/one_shot_data/event_img/sailing/Easy_Mid_sailing_83.jpg',
    'snowboarding': '/evaluation_dataset/one_shot_data/event_img/snowboarding/Easy_Mid_snowboarding_33.jpg'
}

# A simple hook class that returns the input and output of a layer during forward/backward pass
class Hook():
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

class ImageFoldersWithPaths(datasets.ImageFolder):
    def __getitem__(self, index):
        original_tuple = super(ImageFoldersWithPaths, self).__getitem__(index)
        path = self.imgs[index][0]
        tuple_with_path = (original_tuple + (path,))
        return tuple_with_path

def accuracy(y_truth, y_pred):
    '''
        Returns accuracy score 

        y_truth - list of true labels same size as y_pred
        y_pred - list of predicted labels same size as y_truth
    '''
    return float(sum([x==y for x, y in zip(y_truth, y_pred)]))/len(y_truth)


def load_data(datadir, is_valid_file_func= lambda x:True):
    '''
        Returns a pytorch Dataloader

        datadir - directory where each sub directory contains images for a specific class
        is_valid_file_func - function that takes in a file_path and determines if is a valid file for loading with a Dataset object
    '''
    data = datasets.ImageFolder(
        root=datadir,
        transform=transforms_,
        is_valid_file=is_valid_file_func 
    )
    
    dataloader = torch.utils.data.DataLoader(
        data,
        batch_size=1024,
        num_workers=10,
        pin_memory=True
    )
    return dataloader

def load_data_with_paths(datadir, is_valid_file_func= lambda x:True):
    '''
        Returns a pytorch Dataloader, at each iteraction the dataloader returns:(feature_activations, labels, paths)

        datadir - directory where each sub directory contains images for a specific class
        is_valid_file_func - function that takes in a file_path and determines if is a valid file for loading with a Dataset object
    '''
    data = ImageFoldersWithPaths(
        root=datadir,
        transform=transforms_,
        is_valid_file=is_valid_file_func 
    )
    
    dataloader = torch.utils.data.DataLoader(
        data,
        batch_size=1024,
        num_workers=10,
        pin_memory=True
    )
    return dataloader

def evaluate(W, data):
    '''
    Returns label predictions and softmax scores after applying weight matrix (W) to data
    W - class X weights matrix
    data - example X features
    '''
    return np.argmax(
        np.matmul(
            W,
            data.transpose()
        ),
        0
    )

def oneshot_update(K, train_features, novel_features):
    '''
    Builds a new linear classifier based on original train_features and novel features. A new weight matrix (W) is returned

    K - matrix of labels for train features [n_classes, n_train_features] where 1 indicates class label
    train_features - example X features
    novel_features - features for one class [examples, features]
    '''
    features = np.hstack([train_features, novel_features])

    num_samples = train_features.shape[1] + novel_features.shape[1]

    num_classes = train_features.shape[1] + 1

    K_prime = np.zeros((num_classes,num_samples))
    K_prime[0:K.shape[0], 0:K.shape[1]] = K
    for i in range(train_features.shape[1], num_samples):
        K_prime[num_classes - 1,i] = 1

    W = np.matmul( K_prime, np.linalg.pinv(features) )

    return W 


def get_features(device, model, test_dataloader):
    '''
    Gets pre-classification features from a resnet model. Returns true_classnames (determined by test_dataloader), labels, activation features.

    device - pytorch device
    model - pytorch model
    test_dataloader - pytorch dataloader
    '''
    truth_classnames = test_dataloader.dataset.classes
    avgPoolF = Hook(model.avgpool)
    features_arr = []
    labels_arr = []
    with torch.no_grad():
        for i, (inputs, labels) in enumerate(test_dataloader):
            inputs = inputs.to(device)
            outputs = model(inputs)
            print(avgPoolF.output.shape)
            avgPoolF_npy = avgPoolF.output.detach().cpu().reshape( labels.size()[0], -1).numpy()
            features_arr.append(avgPoolF_npy)
            labels_arr.append(labels.detach().cpu().numpy())
        
    features = np.vstack(features_arr)
    labels = np.hstack(labels_arr)
    return truth_classnames, labels, features

def get_features_with_paths(device, model, test_dataloader):
    '''
    Gets pre-classification features from a resnet model. Returns true_classnames (determined by test_dataloader), labels, activation features, image_path.

    device - pytorch device
    model - pytorch model
    test_dataloader - pytorch dataloader
    '''
    truth_classnames = test_dataloader.dataset.classes
    avgPoolF = Hook(model.avgpool)
    features_arr = []
    labels_arr = []
    image_paths = []
    with torch.no_grad():
        for i, (inputs, labels, paths) in enumerate(test_dataloader):
            inputs = inputs.to(device)
            outputs = model(inputs)
            print(avgPoolF.output.shape)
            avgPoolF_npy = avgPoolF.output.detach().cpu().reshape( labels.size()[0], -1).numpy()
            features_arr.append(avgPoolF_npy)
            labels_arr.append(labels.detach().cpu().numpy())
            image_paths += paths

    features = np.vstack(features_arr)
    labels = np.hstack(labels_arr)
    return truth_classnames, labels, features, image_paths

preextracted_data_path = '/export/u10/jfaschin_ad/places_features.npz'

model_path = '/export/u10/users/jfaschin/places.365.resnet18.pth'

def image_loader(image_name):
    """load image, returns cuda tensor"""
    image = Image.open(image_name)
    image = transforms_(image).float()
    image = Variable(image, requires_grad=True)
    image = image.unsqueeze(0)  #this is for VGG, may not be needed for ResNet
    return image.cuda()  #assumes that you're using GPU


def compute_statistics(W_new, gt_label, new_labels, new_classes_features, original_labels, original_features):
    '''
    Computes classification related statistics based on the supplied W_new weight matrix.

    Arguments:
        W_new - linear classifier
        gt_label - integer label for the new class
        new_labels - labels for unseen classes
        new_classes_features - examples X features for unseen classes
        original_labels - labels for original training set
        original_features - examples X features for original training set

    Returns:
        acc_on_whole_set - accuracy on the new_class images + original training set images
        p_new - precision on new class
        r_new - recall on new class
        f1_new - F1 on new class
        acc_on_new_class - accuracy on the new_class
        pg - precision gain on new class
        rg - recall gain on new class
    '''
    y_pred = evaluate(W_new, new_classes_features)
    y_pred_arr = np.array(y_pred)

    y_pred_original = evaluate(W_new, original_features)

    #Y_pred_total = np.vstack((Y_pred_original, Y_pred[new_labels==gt_label,:]))

    N_original = len(y_pred_original)
    N_new = sum(new_labels == gt_label)

    y_pred_total_arr = np.concatenate((np.array(y_pred_original), y_pred_arr[new_labels == gt_label]))

    y_truth_total_arr = np.concatenate((original_labels, np.array([365] * N_new)))

    v = y_truth_total_arr == 365
    # np.set_printoptions(threshold=sys.maxsize)
    # prg_curve = prg.create_prg_curve(y_truth_total_arr == 365, Y_pred_total[:,365])
    # pr_xx, re_xx, _ = precision_recall_curve(y_truth_total_arr,
    #                                                   Y_pred_total[:,365],pos_label=365 )
    #plt.plot(re_xx, pr_xx)

    #print(prg_curve['recall_gain'])
    #print( prg_curve['precision_gain'])
    #plt.plot(prg_curve['recall_gain'], prg_curve['precision_gain'])
    #auprg = prg.calc_auprg(prg_curve)
    #print(auprg)
    
    tp = float(sum(y_pred_total_arr[-N_new:] == [365]*N_new))
    fp = float(sum(y_pred_total_arr[:N_original] == [365]*N_original))
    tn = float(sum(y_pred_total_arr[:N_original] != [365]*N_original))
    fn = float(sum(y_pred_total_arr[-N_new:] != [365]*N_new))
    '''
    print(f'tp:{tp}')
    print(f'fp:{fp}')
    print(f'tn:{tn}')
    print(f'fN:{fn}')


    tpr = tp / (tp + fn)
    fpr = fp / (fp + tn) 
    '''
    pg = prg.precision_gain(tp, fn, fp, tn)
    rg = prg.recall_gain(tp, fn, fp, tn)

    acc_on_whole_set = accuracy(y_truth_total_arr, y_pred_total_arr)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_truth_total_arr,
        y_pred_total_arr,
        labels=range(366),
        zero_division=0
    )
    p_new = precision[365]
    r_new = recall[365]
    f1_new = f1[365]
    acc_on_new_class = accuracy(y_truth_total_arr == 365, y_pred_total_arr == 365)

    return acc_on_whole_set, p_new, r_new, f1_new, acc_on_new_class, pg, rg
    # return acc_on_whole_set, p_new, r_new, f1_new, acc_on_new_class, tpr, fpr


def main():
    experiment_name = '11232020.codecleanup'

    # Load up pretrained model
    num_classes = 365
    model = models.resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path)['state_dict'])
    model.eval()

    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "cpu"
    )

    model.to(device)

    # Recover the weight matrix for the output layer to initialize one-shot detection
    W = model.fc.weight.detach().cpu().numpy()
    b = model.fc.bias.detach().cpu().numpy()

    # Compute the pseudo-inverse to recover features necessary for the one-shot update
    prior_features = np.linalg.pinv(W)

    # Load pre-extracted activation features for both the original places validation set and the images from new_classes
    preextracted_data = np.load(preextracted_data_path)
    
    original_classnames = preextracted_data['original_classnames']
    original_labels = preextracted_data['original_labels']
    original_features = preextracted_data['original_feature']

    new_classnames = preextracted_data['new_classnames']
    new_classes_labels = preextracted_data['new_classes_labels']
    new_classes_features = preextracted_data['new_classes_features']

    # Setting up data frames for analysis
    df = pandas.DataFrame(
        columns=[
            'new_class',
            'mod',
            'value',
            'filter',
            'acc_on_all_classes',
            'acc_on_new_class',
            'p_new',
            'r_new',
            'f1_new'
        ]
    )
    df_summary = pandas.DataFrame(
        columns=[
            'new_class',
            'filter',
            'aupg',
            'aupr'
        ]
    )

    for new_class, example_path in one_shot_examples.items():
        print(new_class)
        
        # Loading up the oneshot example image for that class
        training_image_path = example_path

        training_image = image_loader(training_image_path)

        avgPoolF = Hook(model.avgpool)

        # Recovering the activations
        output = model(training_image)

        avgPoolF_npy = avgPoolF.output.detach().cpu().numpy()
        #active_srt = [y for _, y in sorted(zip(avgPoolF_npy[0,:,:,0], range(512)),reverse=True)]
        #print(active_srt[:20])

        # Determine new weight matrix W_new for linear classification
        W_new = oneshot_update( np.eye(365), prior_features, avgPoolF_npy[0,:,:,0])

        # Rescale W_new
        scale_factor_sum = 0
        for x in range(365):
            numerator = np.sqrt(np.mean(np.square(W_new[x, :])))
            denomonator = np.sqrt(np.mean(np.square(W_new[365, :])))
            scale_factor_sum += numerator/denomonator
        scale_factor = scale_factor_sum / 365
        W_new[365, :] *= scale_factor

        # Save new weight matrix for further investigation
        np.savez(f'{new_class}_w_new.{experiment_name}', W_new)
        
        # Predict using new weight matrix
        y_pred, _ = evaluate(W_new, new_classes_features)
        
        # Determine the index assigned to the new class amongst the other new classes
        gt_label = list(new_classnames).index(new_class)
        
        # Create numpy arrays for easier syntax
        y_truth_arr = np.array(new_classes_labels)
        y_pred_arr  = np.array(y_pred)

        # Count number of false negatives from the new class
        misclassified = np.logical_and(y_truth_arr == gt_label, y_pred_arr < 365)

        print(f'Number of false negatives for new class: {sum(misclassified)}')
        
        # Print out which of the original classes, examples of the new class are confused with
        print(f'Confused classes:')
        print(f'-----------------')
        for class_name, count in Counter([original_classnames[x] for x in y_pred_arr[misclassified]]).most_common():
            print(f'{class_name}:{count}')
        print(f'-----------------')
        
        # Print out the number from the new class that are correct
        n_correct = sum(np.logical_and(y_truth_arr == gt_label, y_pred_arr == 365))
        print(n_correct)
        W_new_base = np.copy(W_new)

        top_positive_weights = []
        top_negative_weights = []

        new_class_most_positive_filters = [x for _, x in sorted(zip(W_new[365, :], range(512)), reverse=True)][:20]
        new_class_most_negative_filters = [x for _, x in sorted(zip(W_new[365, :], range(512)))][:20]

        filters_to_try = new_class_most_positive_filters + new_class_most_negative_filters
                
        for filter_index in filters_to_try:
            pg_l = []
            rg_l = []
            p_l = []
            r_l = []
            for magnitude in range(-5, 6, 2):
                W_new = np.copy(W_new_base)

                # Set the weight value to be the highest weight value or lowest weight value for the weight vector depending on the sign of the original weight value for that filter
                weight_value = W_new[365, new_class_most_positive_filters[0]] if W_new[365, filter_index] > 0 else W_new[365, new_class_most_negative_filters[0]]
                W_new[365, filter_index] = magnitude * weight_value
                # W_new[365, filter_index] = magnitude * W_new[365, filter_index]
                tic = time.perf_counter()

                # Compute statistics based on the modified W_new matrix
                acc_on_whole_set, p_new, r_new, f1_new, acc_on_new_class, pg, rg = compute_statistics(W_new, gt_label, y_truth_arr, new_classes_features, original_labels, original_features)
                print(f'pg:{pg} rg:{rg}')
                pg_l.append(pg)
                rg_l.append(rg)
                p_l.append(p_new)
                r_l.append(r_new)
                toc = time.perf_counter()
                print(f'Stats time: {toc-tic:.2f}')
                df = df.append(
                    {
                        'new_class': new_class, 
                        'mod': 'multiply',
                        'filter': filter_index,
                        'value': magnitude,
                        'acc_on_all_classes': acc_on_whole_set,
                        'acc_on_new_class': acc_on_new_class,
                        'p_new': p_new,
                        'r_new': r_new,
                        'f1_new': f1_new
                    },
                    ignore_index=True
                )
                # print(acc_on_whole_set)
                # print(f'Precision on new class: {p_new}')
                # print(f'Recall on new class: {r_new}')
                # print(f'F1 on new class: {f1_new}')
                # print(f'Accuracy on new class: {acc_on_new_class}')
                # print(df)
            sorted_pr_l = sorted(zip(r_l, p_l))
            p_l = [x for _, x in sorted_pr_l]
            r_l = [y for y, _ in sorted_pr_l]

            sorted_prg_l = sorted(zip(rg_l, pg_l))
            pg_l = [x for _, x in sorted_prg_l]
            rg_l = [y for y, _ in sorted_prg_l]
            df_summary = df_summary.append(
                {
                    'new_class': new_class,
                    'filter': filter_index,
                    'aupg': prg.calc_auprg(
                        {
                            'precision_gain': pg_l,
                            'recall_gain': rg_l
                        }
                    ),
                    'aupr': auc(r_l, p_l)
                },
                ignore_index=True
            )
            print('WRITE SUMMARY')
            df_summary.to_pickle(f"./results.summary.{experiment_name}.pkl")

    df.to_pickle(f"./results.{experiment_name}.pkl")


if __name__=="__main__":
    main()
