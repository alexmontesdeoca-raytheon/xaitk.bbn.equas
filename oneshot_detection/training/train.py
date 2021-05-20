#%matplotlib inline
#%config InlineBackend.figure_format = 'retina'
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch import nn
from torch import optim
import torch.nn.functional as F
from torchvision import datasets, transforms, models
from torch.optim import lr_scheduler
import time
import copy


data_dir = '/export/u10/jfaschin_ad/aeroplane_data/'

def load_split_train_test(datadir, valid_size = .2):
    train_transforms = transforms.Compose(
        [
            transforms.Resize((255)),
            transforms.CenterCrop(227),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ]
    )
    test_transforms = transforms.Compose(
        [
            transforms.Resize((255)),
            transforms.CenterCrop(227),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ]
    )
    train_data = datasets.ImageFolder(
        datadir,       
        transform=train_transforms
    )
    test_data = datasets.ImageFolder(
        datadir,
        transform=test_transforms
    )
    num_train = len(train_data)
    indices = list(range(num_train))
    split = int(np.floor(valid_size * num_train))
    np.random.shuffle(indices)

    from torch.utils.data.sampler import SubsetRandomSampler

    train_idx, test_idx = indices[split:], indices[:split]
    train_sampler = SubsetRandomSampler(train_idx)
    test_sampler = SubsetRandomSampler(test_idx)
    trainloader = torch.utils.data.DataLoader(train_data,
                                              sampler=train_sampler, batch_size=1024, num_workers=10, pin_memory=True)
    testloader = torch.utils.data.DataLoader(test_data,
                                             sampler=test_sampler, batch_size=1024, num_workers=10, pin_memory=True)
    return trainloader, testloader, train_data, test_data

trainloader, testloader, train_data, test_data = load_split_train_test(data_dir, .2)
dataloaders = dict()
dataloaders['train'] = trainloader
dataloaders['val'] = testloader
dataset_sizes = {
    'train':len(train_data),
    'val':len(test_data)
}
print(trainloader.dataset.classes)

device = torch.device("cuda" if torch.cuda.is_available() 
                                  else "cpu")
model = models.alexnet(pretrained=True)

print(model)

# for param in model.parameters():
#     param.requires_grad = False

model.classifier[6] = nn.Linear(4096, 100)

print(model)

criterion = nn.CrossEntropyLoss()
optimizer = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)

exp_lr_scheduler = lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

model.to(device)

epochs = 50
steps = 0
running_loss = 0
print_every = 10
train_losses, test_losses = [], []
for epoch in range(epochs):
    for inputs, labels in trainloader:
        steps += 1
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        logps = model.forward(inputs)
        loss = criterion(logps, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * inputs.size(0)
        
        if steps % print_every == 0:
            test_loss = 0
            accuracy = 0
            model.eval()
            with torch.no_grad():
                for inputs, labels in testloader:
                    inputs, labels = inputs.to(device), labels.to(device)
                    logps = model.forward(inputs)
                    batch_loss = criterion(logps, labels)
                    test_loss += batch_loss.item() * inputs.size(0)
                    
                    ps = torch.exp(logps)
                    top_p, top_class = ps.topk(1, dim=1)
                    equals = top_class == labels.view(*top_class.shape)
                    accuracy += torch.mean(equals.type(torch.FloatTensor)).item()
            train_losses.append(running_loss/print_every)
            test_losses.append(test_loss/len(testloader))                    
            print(f"Epoch {epoch+1}/{epochs}.. "
                  f"Train loss: {running_loss/print_every:.3f}.. "
                  f"Test loss: {test_loss/len(testloader):.3f}.. "
                  f"Test accuracy: {accuracy/len(testloader):.3f}")
            running_loss = 0
            model.train()

torch.save(model, 'aeroplanemodel.pth')


plt.plot(train_losses, label='Training loss')
plt.plot(test_losses, label='Validation loss')
plt.legend(frameon=False)
plt.show()


