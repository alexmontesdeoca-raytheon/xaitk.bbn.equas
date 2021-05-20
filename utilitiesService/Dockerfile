FROM ubuntu:18.04

RUN apt-get update && apt-get install -y \
    cython3 \
    gcc \
    mc \
    nano \
    # python3 \ Ubuntu 17.10 and 18.04 already comes with Python 3.6 as default
    python3-numpy \
    python3-pip \
    python3-setuptools \
    python3-scipy \
    python-numpy \
    vim \
    libmysqlclient-dev \
    gfortran

RUN pip3 install -U pip

WORKDIR /utilitiesService


ARG include_models

COPY requirements_linux_full.txt requirements_linux_no_models.txt ./
RUN if [ "x$include_models" = "x" ]; then \
        pip3 install -r /utilitiesService/requirements_linux_no_models.txt; \
    else \
        pip3 install -r /utilitiesService/requirements_linux_full.txt; \
    fi

RUN rm /utilitiesService/requirements_linux_full.txt /utilitiesService/requirements_linux_no_models.txt

# this copies all files including the models if they are present
# if models are present, they are removed if arg is not set
COPY . /utilitiesService
RUN if [ "x$include_models" = "x" ]; then rm -rf /utilitiesService/models; fi
RUN ls -la /utilitiesService/*

RUN pip3 install /utilitiesService/prg/Python_package

EXPOSE 8195
CMD ["python3", "-u", "/utilitiesService/utilities_service.py"]
