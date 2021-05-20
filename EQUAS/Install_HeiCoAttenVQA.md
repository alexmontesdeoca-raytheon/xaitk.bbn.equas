
#Install  HieCoAttenVQA on Ubuntu 16.04

Install Ubuntu 16.04

sudo apt-get update

sudo apt-get upgrade

###Update NVidia Driver to 390

####add the graphics drivers repository
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update

###install the most recent drivers
sudo apt install nvidia-390 nvidia-390-dev

reboot

###verify the installation
nvidia-smi

###install a bunch of build/dev packages needed later
sudo apt-get install g++ freeglut3-dev build-essential libx11-dev libxmu-dev libxi-dev libglu1-mesa libglu1-mesa-dev gfortran

sudo add-apt-repository ppa:ubuntu-toolchain-r/test

sudo apt update

###blacklist nouveau
sudo vi /etc/modprobe.d/blacklist.conf

###add the following:

blacklist amd76x_edac 

blacklist vga16fb

blacklist nouveau

blacklist rivafb

blacklist nvidiafb

blacklist rivatv

###Update initramfs disk
sudo update-initramfs -u


##Install Cuda
###download cuda from https://developer.nvidia.com/cuda-downloads
###install Cuda 8 Feb 2017 version 
Choose 16.04 and runfile (local)

Download base and patchs

cd to download location

e.g., sudo sh cuda_9.1.85_387.26_linux.run —override

accept

Install NVIDIA Accelerated Graphics Driver for Linux-x86_64 387.26?

No

Install Toolkit?

Yes

default location

Install symbolic link?

Yes

Install samples? 

Yes

Samples location

default

e.g., sudo sh cuda_9.1.85_387.26_linux.run 

sudo sh cuda_9.1.85.1_linux.run

sudo sh cuda_9.1.85.2_linux.run

sudo sh cuda_9.1.85.3_linux.run

sudo ln -s /usr/bin/gcc-5 /usr/local/cuda/bin/gcc

sudo ln -s /usr/bin/g++-5 /usr/local/cuda/bin/g++

sudo ln -s /usr/bin/gcc-5 /usr/local/cuda/bin/cc

###add exports to .bashrc
export PATH=/usr/local/cuda-9.1/bin${PATH:+:${PATH}}

export LD_LIBRARY_PATH=/usr/local/cuda-9.1/lib64:${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}

export TORCH_NVCC_FLAGS=“-D__CUDA_NO_HALF_OPERATORS__”

###Test install
cd ~/NVIDIA_CUDA-9.0_Samples/5_Simulations/smokeParticles

make

../../bin/x86_64/linux/release/smokeParticles 

##Install CuDNN
https://developer.nvidia.com/cudnn

##Need to download cudnn version 6.x
###follow install directions 
e.g., sudo dpkg -i libcudnn6…amd64.deb

###make sure to update your shell environment variables
export LD_LIBRARY_PATH=“$LD_LIBRARY_PATH:/usr/local/cuda/lib64”

export CUDA_HOME=/usr/local/cuda

##Install Git
sudo apt install git


##Install Torch
http://torch.ch/docs/getting-started.html#_

mkdir ~/git

cd git

git clone https://github.com/torch/distro.git torch —recursive

cd torch

bash install-deps

./install.sh

source ~/.bashrc

### install Python NLTK
sudo apt-get install python-pip

sudo pip install —upgrade pip

sudo pip install -U nltk

###install numpy and scipy
sudo pip install numpy

sudo pip install scipy

sudo pip install h5py

###install nltk punkt
python

import nltk

nltk.download(‘punkt’)

quit()

###Install torch-hdf5
sudo apt-get install libhdf5-serial-dev hdf5-tools

cd ~/git

git clone 

https://github.com/deepmind/torch-hdf5

cd torch-hdf5

luarocks make hdf5-0-0.rockspec LIBHDF5_LIBDIR="/usr/lib/x86_64-linux-gnu/"

sudo apt-get install libprotobuf-dev protobuf-compiler

luarocks install lua-cjson

luarocks install luabitop

luarocks install loadcaffe


###Install iTorch prereqs
luarocks install lzmq

sudo apt-get install libssl-dev

###Install iTorch
cd ~/git

git clone https://github.com/facebook/iTorch.git

cd iTorch

luarocks make

###Install ipython-notebook (via Jupyter)
sudo pip install jupyter

(or pip3 if using python 3.5/6)

luarocks install luasocket

cd ~/git

git clone git@bud.dsl.bbn.com:XAI

##download models and put here:
https://filebox.ece.vt.edu/%7Ejiasenlu/codeRelease/co_atten/model/

cd ~/git/XAI/EQUAS/ext/HieCoAttenVQA/model/vqa_model

##download corresponding json file:
https://filebox.ece.vt.edu/%7Ejiasenlu/codeRelease/co_atten/data_file/vqa_data_prepro.json
###put here:
cd ~/git/XAI/EQUAS/ext/HieCoAttenVQA/data
