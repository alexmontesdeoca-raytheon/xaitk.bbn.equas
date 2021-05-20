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
import json
from prg import prg
from oneshot_places365 import image_loader, Hook, compute_statistics, evaluate3

# one_shot_examples = {
#     'badminton':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/badminton/Easy_Mid_badminton_98.jpg', 
#     'bocce':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/bocce/Medium_Mid_bocce_78.jpg',  
#     'croquet': '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/croquet/Easy_Mid_croquet_2.jpg',  
#     'polo': '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/polo/Easy_Mid_polo_96.jpg',
#     'RockClimbing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/RockClimbing/Easy_Mid_RockClimbing_90.jpg',
#     'rowing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/rowing/Easy_Mid_Rowing_5.jpg',
#     'sailing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/sailing/Easy_Mid_sailing_83.jpg',
#     'snowboarding':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/snowboarding/Easy_Mid_snowboarding_33.jpg'
# }



def write_out_subset(total_dict, indices, output_path):
    output_dict = dict()
    output_dict['header'] = total_dict['header']
    output_dict['units'] = [total_dict['units'][x] for x in indices]
    for i in range(len(output_dict['units'])):
        output_dict['units'][i]['index'] = i
    json.dump(output_dict, open(output_path, 'w'))


def main():
    classes = [
        'badminton', 
        'bocce',  
        'croquet',  
        'polo',
        'RockClimbing',
        'rowing',
        'sailing',
        'snowboarding' 
    ]
    network_dissect_json_path = 'report.json'
    network_dissect = json.load(open(network_dissect_json_path, 'r'))
    num_classes = 365
    model_path = '/export/u10/users/jfaschin/places.365.resnet18.pth'
    model = models.resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path)['state_dict'])
    model.eval()

    device = torch.device(
         "cuda" if torch.cuda.is_available() 
        else "cpu"
    )

    W = model.fc.weight.detach().cpu().numpy()
    b = model.fc.bias.detach().cpu().numpy()

    prior_features = np.linalg.pinv(W)

    preextracted_data_path = '/export/u10/jfaschin_ad/places_features_with_paths.npz'

    preextracted_data = np.load(preextracted_data_path)
    
    original_classnames = preextracted_data['original_classnames']
    original_labels = preextracted_data['original_labels']
    original_features = preextracted_data['original_feature']
    original_paths = preextracted_data['original_paths']

    new_classnames = preextracted_data['new_classnames']
    new_classes_labels = preextracted_data['new_classes_labels']
    new_classes_features = preextracted_data['new_classes_features']
    new_classes_paths = preextracted_data['new_classes_paths']


    experiment_name = 'top_distractors_one_class.11252020'
    output_dir = experiment_name


    model.to(device)

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

    for new_class in classes:
        print(new_class)
        gt_label = new_classnames.index(new_class)
        class_mask = new_classes_labels == gt_label

        new_class_labels = new_class_labels[class_mask]
        new_class_paths = [x for i, x in new_class_paths if class_mask[i]]
        new_class_features = new_class_features[class_mask, :]
        
        for path, features in zip(new_class_paths, new_class_features):

            # Create new one-shot detector
            W_new_base = oneshot_update(np.eye(365), prior_features, features)

            # Collect activations
            activations_sorted = [y for _, y in sorted(zip(features, range(512)),reverse=True)]

            # Try filters
            for filter_index in activations_sorted[:20]:
                for magnitude in range(0, 5, 1):
                    W_new = np.copy(W_new_base)
                    weight_value = W_new[365, new_class_most_negative_filters[0]]
                    W_new[365, filter_index] = magnitude * weight_value

                    tic = time.perf_counter()
                    
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



if __name__=="__main__":
    main()
