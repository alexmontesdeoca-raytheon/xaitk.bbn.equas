FROM nvidia/cuda:10.0-cudnn7-devel

ENV CONDA_PATH=/opt/anaconda3
ENV ENVIRONMENT_NAME=denv
SHELL ["/bin/bash", "-c"]

# curl is required to download Anaconda.
RUN apt-get update && apt-get install curl git -y

# Download and install Anaconda.
RUN cd /tmp && curl -O https://repo.anaconda.com/archive/Anaconda3-2019.07-Linux-x86_64.sh
RUN chmod +x /tmp/Anaconda3-2019.07-Linux-x86_64.sh
RUN mkdir /root/.conda
RUN bash -c "/tmp/Anaconda3-2019.07-Linux-x86_64.sh -b -p ${CONDA_PATH}"

# Initializes Conda for bash shell interaction.
RUN ${CONDA_PATH}/bin/conda init bash

# Upgrade Conda to the latest version
RUN ${CONDA_PATH}/bin/conda update -n base -c defaults conda -y

# Create the work environment and setup its activation on start.
RUN ${CONDA_PATH}/bin/conda create --name ${ENVIRONMENT_NAME} -y
RUN echo conda activate ${ENVIRONMENT_NAME} >> /root/.bashrc

COPY ./environment.yml /tmp/
RUN . ${CONDA_PATH}/bin/activate ${ENVIRONMENT_NAME} \
  && conda env update --file /tmp/environment.yml --prune

RUN git clone https://github.com/davidbau/dissect /root/dissect

RUN apt-get install emacs -y

COPY ./torch_cache.tar.gz /root/

COPY ./dissect_simple.sh /root/dissect 

COPY ./datasets.tar.gz /root/dissect

COPY ./oid_small.tar.gz /root/dissect

COPY ./test-gpu.py /root