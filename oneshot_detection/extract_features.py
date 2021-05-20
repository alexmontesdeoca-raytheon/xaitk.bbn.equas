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
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, precision_recall_fscore_support
import sys
import os
from collections import Counter
import math
import random
from PIL import Image
from torch.autograd import Variable
from oneshot_places365 import load_data, load_data_with_paths, get_features, get_features_with_paths

new_classes_datadir = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/event_img/'

original_classes_datadir = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/places365_standard/val/'

model_path = '/export/u10/users/jfaschin/places.365.resnet18.pth'


def main():
    """
    This script computes feature activations for a resnet18 model for two different datasets
    
    original_classes_datadir - validation dataset for original classifier
    new_classes_datadir - dataset with new classes

    """

    # Load model
    num_classes = 365
    model = models.resnet18(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path)['state_dict'])
    model.eval()

    device = torch.device(
        "cuda" if torch.cuda.is_available() 
        else "cpu"
    )

    model.to(device)

    # Create dataloaders with paths
    original_classes_dataloader = load_data_with_paths(original_classes_datadir)
    new_classes_dataloader = load_data_with_paths(new_classes_datadir)

    # Extract feature activations
    original_classnames, original_labels, original_features, original_paths = get_features_with_paths(device, model, original_classes_dataloader)

    # Save
    new_classnames, new_classes_labels, new_classes_features, new_classes_paths = get_features_with_paths(device, model, new_classes_dataloader)

    np.savez(
        'test_features',
        #'places_features',
        original_classnames=original_classnames,
        original_labels=original_labels,
        original_feature=original_features,
        original_paths=original_paths,
        new_classnames=new_classnames,
        new_classes_labels=new_classes_labels,
        new_classes_features=new_classes_features,
        new_classes_paths=new_classes_paths
    )
    print('Done')
if __name__=="__main__":
    main()
