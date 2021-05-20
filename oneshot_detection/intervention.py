#%matplotlib inline
#%config InlineBackend.figure_format = 'retina'
import matplotlib.pyplot as plt
import numpy as np
import sys
import argparse
from oneshot_places365 import compute_statistics

import json


new_classes_datadir = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/'

original_classes_datadir = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/places365_standard/val/'

preextracted_data_path = '/export/u10/jfaschin_ad/places_features.npz'

model_path = '/export/u10/users/jfaschin/places.365.resnet18.pth'


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
    plt.plot(range(512), W_class_sorted)
    plt.axhline(linewidth=4, color='r')
    plt.show()
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


def main(args):

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

    weight_matrix = np.load(args.weights_file)['arr_0']
    new_class = args.new_class
    unit_dict = json.load(open(args.unit_json, 'r'))

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

    print(f'Accuracy before: {acc_on_whole_set_before}')
    print(f'Accuracy after: {acc_on_whole_set_after}')
    print(f'New Class F1 before: {f1_new_before}')
    print(f'New Class F1 after: {f1_new_after}')


if __name__=="__main__":
    main(parse_args(sys.argv[1:]))
