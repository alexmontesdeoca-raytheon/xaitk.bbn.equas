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
from oneshot_places365 import image_loader, Hook

one_shot_examples = {
    'badminton':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/badminton/Easy_Mid_badminton_98.jpg', 
    'bocce':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/bocce/Medium_Mid_bocce_78.jpg',  
    'croquet': '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/croquet/Easy_Mid_croquet_2.jpg',  
    'polo': '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/polo/Easy_Mid_polo_96.jpg',
    'RockClimbing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/RockClimbing/Easy_Mid_RockClimbing_90.jpg',
    'rowing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/rowing/Easy_Mid_Rowing_5.jpg',
    'sailing':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/sailing/Easy_Mid_sailing_83.jpg',
    'snowboarding':'/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/snowboarding/Easy_Mid_snowboarding_33.jpg'
}



def write_out_subset(total_dict, indices, output_path):
    output_dict = dict()
    output_dict['header'] = total_dict['header']
    output_dict['units'] = [total_dict['units'][x] for x in indices]
    for i in range(len(output_dict['units'])):
        output_dict['units'][i]['index'] = i
    json.dump(output_dict, open(output_path, 'w'))


def main():
    """
    This program creates unit.json files ordered with the 20 highest activating
    filters for the one shot images are given the highest weights.
    """
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

    output_dir = 'activations_rankings_v2'


    model.to(device)
    for new_class, example_path in one_shot_examples.items():
        print(new_class)

        training_image_path = example_path

        training_image = image_loader(training_image_path)

        avgPoolF = Hook(model.avgpool)

        output = model(training_image)

        avgPoolF_npy = avgPoolF.output.detach().cpu().numpy()
        activations_sorted = [y for _, y in sorted(zip(avgPoolF_npy[0,:,:,0], range(512)),reverse=True)]
        
        weight_matrix_path = f'{new_class}_w_new.testing.11032020.npz'
        W_new = np.load(weight_matrix_path)['arr_0']
        original_weights_w_index = sorted(zip(W_new[365, :], range(512)), reverse=True)
        #weights_sorted = [x for x, _ in original_weights_w_index]
        sorted_index = [y for _,y in original_weights_w_index if y not in activations_sorted[:20]]
        new_sorted = activations_sorted[:20] + sorted_index

        os.makedirs(os.path.join(output_dir, new_class), exist_ok=True)
        write_out_subset(
            network_dissect,
            new_sorted,
            f'{output_dir}/{new_class}/units.json'
        )


if __name__=="__main__":
    main()
