FROM caffe2/caffe2:snapshot-py2-cuda9.0-cudnn7-ubuntu16.04

# Install basic deps
RUN apt-get update && apt-get install -y nano sudo wget build-essential cmake curl gfortran git  \
  libatlas-dev libavcodec-dev libavformat-dev libboost-all-dev libgtk2.0-dev libjpeg-dev   \
  liblapack-dev libswscale-dev pkg-config python-dev python-pip software-properties-common \
  graphicsmagick libgraphicsmagick1-dev python-numpy zip \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

### ------------------ VNC ------------------------

## Connection ports for controlling the UI:
# VNC port:5901
# noVNC webport, connect via http://IP:6901/?password=vncpassword
ENV DISPLAY=:1 \
  VNC_PORT=5901 \
  NO_VNC_PORT=6901
EXPOSE $VNC_PORT $NO_VNC_PORT

### Envrionment config
ENV HOME=/headless \
  TERM=xterm \
  STARTUPDIR=/dockerstartup \
  INST_SCRIPTS=/headless/install \
  NO_VNC_HOME=/headless/noVNC \
  DEBIAN_FRONTEND=noninteractive \
  VNC_COL_DEPTH=24 \
  VNC_RESOLUTION=1280x1024 \
  VNC_PW=vncpassword \
  VNC_VIEW_ONLY=false
WORKDIR $HOME

### Add all install scripts for further steps
ADD ./src/common/install/ $INST_SCRIPTS/
ADD ./src/ubuntu/install/ $INST_SCRIPTS/
RUN find $INST_SCRIPTS -name '*.sh' -exec chmod a+x {} +

### Install some common tools
RUN $INST_SCRIPTS/tools.sh
ENV LANG='en_US.UTF-8' LANGUAGE='en_US:en' LC_ALL='en_US.UTF-8'

### Install xvnc-server & noVNC - HTML5 based VNC viewer
RUN $INST_SCRIPTS/tigervnc.sh
RUN $INST_SCRIPTS/no_vnc.sh

### Install firefox and chrome browser
#RUN $INST_SCRIPTS/firefox.sh
RUN $INST_SCRIPTS/chrome.sh

### Install xfce UI
RUN $INST_SCRIPTS/xfce_ui.sh
ADD ./src/common/xfce/ $HOME/

### configure startup
RUN $INST_SCRIPTS/libnss_wrapper.sh
ADD ./src/common/scripts $STARTUPDIR
RUN $INST_SCRIPTS/set_user_permission.sh $STARTUPDIR $HOME

###noVNC Port
EXPOSE 6901
###VNC Port
EXPOSE 5901

USER 0


### ------------------ Faithful ------------------------

###VQA Port
EXPOSE 8290

# # Install Java 8.
# RUN \
#   echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections && \
#   add-apt-repository -y ppa:webupd8team/java && \
#   apt-get update && \
#   apt-get install -y oracle-java8-installer && \
#   rm -rf /var/lib/apt/lists/* && \
#   rm -rf /var/cache/oracle-jdk8-installer

# # Define commonly used JAVA_HOME variable
# ENV JAVA_HOME /usr/lib/jvm/java-8-oracle

WORKDIR /faithful

RUN apt-get install -y 

# Upgrade pip
RUN pip install --upgrade pip
# Fixes https://github.com/googleapis/google-cloud-python/issues/3884
# RUN pip install --upgrade setuptools --user python

# Install cython - required for benepar
RUN pip install cython

# pygobject Dependencies
RUN apt-get update && apt-get install -y libgirepository1.0-dev build-essential \
  libbz2-dev libreadline-dev libssl-dev zlib1g-dev libsqlite3-dev wget \
  curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libcairo2-dev


ADD requirements.txt /tmp/requirements.txt 
RUN pip install --requirement /tmp/requirements.txt


# rm npz_features #default link is broken for me
# ln -s ${segmentation_download_dir} npz_features #if you didn't need to put your folder elsewhere, no need to make the link. just put the dir here in faithful_explanation
# ln -s ${h5_data_dir} h5data #same applies here

#cocoapi
RUN git clone https://github.com/cocodataset/cocoapi.git /faithful/cocoapi
RUN cd /faithful/cocoapi/PythonAPI/ && \
  python ./setup.py install && \
  make && \
  make install

#detectron
RUN git clone https://github.com/facebookresearch/detectron.git /faithful/detectron
RUN cd /faithful/detectron/ && \
  python ./setup.py install && \
  make && \
  make install  


# seg_every_thing
# ADD ./seg_every_thing/ /faithful/seg_every_thing
RUN git clone https://github.com/jialinwu17/seg_every_thing.git /faithful/seg_every_thing
RUN cd /faithful/seg_every_thing/lib/ && \
  python ./setup.py install && \
  make && \
  make install

# #add this to your .bashrc
# export PYTHONPATH="${PYTHONPATH}:/path/to/projectTLD/detectron/detectron"
ENV PYTHONPATH /faithful/detectron/detectron:${PYTHONPATH}

# #make sure it works
# python /path/to/projectTLD/detectron/detectron/tests/test_spatial_narrow_as_op.py

# #grab cider and coco-caption
RUN git clone https://github.com/ruotianluo/cider.git /faithful/cider
RUN git clone https://github.com/jialinwu17/coco-caption.git /faithful/coco-caption

# #gather Stanford NLP models
RUN cd /faithful/coco-caption && ./get_stanford_models.sh && cd ..
RUN mkdir saved_models vqa_saved_models
# ln -s /path/to/empty/VQX_results VQX_results #VQX_results is another folder that holds a lot of data. Again, just make empty directory if your file system can handle it.


# #visualizing
# cp colormap.py vis/
# mkdir /path/to/results/VQX_vis_results #actually isn't that much data in image output
# ln -s /path/to/results/VQX_vis_results VQX_vis_results
# cd /path/to/projectTLD
# mkdir xai && cd xai
# ln -s /path/to/h5data data
# cd .. #back to TLD
# python -c "import nltl; nltk.download('averaged_perceptron_tagger')"
# python -c "import benepar; benepar.download('benepar_en')"


# #additional packages
# /path/to/conda/env/bin/pip install h5py sklearn pillow
RUN pip install h5py sklearn pillow

# faithful source code
# ADD ./faithful_explanation/ /faithful/faithful_explanation
# WORKDIR /faithful/faithful_explanation
RUN python -c "import nltk; nltk.download('averaged_perceptron_tagger')"
RUN python -c "import benepar; benepar.download('benepar_en')"

# RUN ln -s /faithful/cocoapi
# RUN ln -s /faithful/cider
# RUN ln -s /faithful/coco-caption

# RUN ln -s /faithful/faithful_explanation_data/h5data
# RUN ln -s /faithful/faithful_explanation_data/npz_features
# RUN ln -s /faithful/faithful_explanation_data/saved_models
# RUN mkdir VQX_results

WORKDIR /faithful

# #change seg_every_thing_configs
# #update based on your number of GPUs. For me I had 1 GPU
# cd /path/to/TLD/seg_every_thing
# #TODO attach my modify_yaml.py
# #we probably won't need this since we're going to be using a pretrained model
# find . -type f -name '*.yaml' -exec python modify_yaml.py {} \;



# #download custom annotations and put inside coco dataset folder
# cd /path/to/coco_dataset
# mkdir annotations
# wget https://s3-us-west-2.amazonaws.com/detectron/coco/coco_annotations_minival.tgz
# tar -xvzf coco-annotations_minival.tgz #ignore warnings about "tar: Ignoring unknown extended header keyword: "
# rm coco-annotations_minival.tgz #if you want
# #get standard annotations
# wget http://images.cocodataset.org/annotations/annotations_trainval2014.zip

# unzip annotations_trainval2014.zip
# rm annotations_trainval2014.zip #if you want




# #the notes say to put links in $DETECTRON
# #actually need to put in both detectron and seg_every_thing 

# #set soft links for coco dataset
# cd /path/to/TLD/seg_every_thing/lib/datasets/data
# mkdir coco && cd coco
# ln -s /path/to/coco_dataset/test2014 coco_test2014
# ln -s /path/to/coco_dataset/train2014 coco_train2014
# ln -s /path/to/coco_dataset/val2014 coco_val2014
# ln -s /path/to/coco_dataset/annotations annotations


# #REPEAT for /path/to/detectron/detectron/lib/datasets/data


# #modify any scripts in SET/tools/ that you want to run
# #when running as-is, they will complain something like "core.whatever" not found
# #just change it to "detectron.core.whatever"
# #this only works if you have your PYTHONPATH set from above


# #same commands as what's in readme 

# #training
# CUDA_VISIBLE_DEVICES=0 python train_coverage_phrase_all.py 

# #evaluating
# CUDA_VISIBLE_DEVICES=0 python eval.py --dump_images 0 --num_images 1968 --model saved_models/{your_model}/model-best.pth --infos_path saved_models/{your_model}/infos_{your_model_id}-best.pkl --sample_max 0 --beam_size 3 --language_eval 1 

# #visualize cmd
# python vis/vis_links.py


# RUN snap install pycharm-community --classic

ADD startup.sh /dockerstartup/
RUN find /dockerstartup -name '*.sh' -exec chmod a+x {} +
ENTRYPOINT ["/dockerstartup/startup.sh"]
CMD ["--wait"]

# You should now be able to connect to the container via VNC on port 5901 or the browser of 6901
# password: vncpassword
