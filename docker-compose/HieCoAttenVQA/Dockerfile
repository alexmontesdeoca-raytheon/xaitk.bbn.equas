FROM nvidia/cuda:8.0-cudnn5-devel-ubuntu16.04

# Install basic deps
RUN apt-get update && apt-get install -y nano sudo wget build-essential cmake curl gfortran git  \
  libatlas-dev libavcodec-dev libavformat-dev libboost-all-dev libgtk2.0-dev libjpeg-dev   \
  liblapack-dev libswscale-dev pkg-config python-dev python-pip software-properties-common \
  graphicsmagick libgraphicsmagick1-dev python-numpy zip \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN git clone https://github.com/torch/distro.git /root/torch --recursive && cd /root/torch && \
  bash install-deps

##RUN cd /root/torch && ./install.sh
### Results in following error for(RUN luarocks install luabitop).
#Error: Rock luabitop 2.1.0beta1-1 was found but it is provided by VM or 'rocks_provided' in the config file.

RUN cd /root/torch && ./install.sh

RUN ln -s /root/torch/install/bin/* /usr/local/bin

RUN luarocks install cutorch && luarocks install cunn && luarocks install cudnn

### Custom items for HieCoAttenVQA
RUN apt-get install -y libhdf5-serial-dev hdf5-tools

RUN git clone https://github.com/deepmind/torch-hdf5 /root/torch-hdf5
RUN cd /root/torch-hdf5 && luarocks make hdf5-0-0.rockspec LIBHDF5_LIBDIR="/usr/lib/x86_64-linux-gnu/"

RUN apt-get install -y libprotobuf-dev protobuf-compiler
RUN luarocks install lua-cjson
RUN luarocks install loadcaffe
RUN luarocks install lzmq
RUN luarocks install luasocket

WORKDIR /root

###VQA Port
EXPOSE 8088

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

USER 0

# ADD ./HieCoAttenVQA/ /root/HieCoAttenVQA

WORKDIR /root

###noVNC Port
EXPOSE 6901
###VNC Port
EXPOSE 5901

ENTRYPOINT ["/dockerstartup/vnc_startup.sh"]
CMD ["--wait"]
