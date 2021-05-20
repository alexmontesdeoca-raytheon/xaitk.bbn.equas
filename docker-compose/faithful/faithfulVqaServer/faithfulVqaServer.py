#!/usr/bin/env python2

import os
import sys
import json
import requests
from PIL import Image
from io import BytesIO
import socket
import StringIO

import cPickle
import cv2
import matplotlib as mpl
mpl.use('Agg') #no longer need $DISPLAY set
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

import pycocotools.mask as mask_util
import numpy as np
import benepar
parser = benepar.Parser("benepar_en")

#word_to_rgb = {
#"red" : np.array([238, 59, 59]),
#"blue" : np.array([142, 229, 238]),
#"orange" : np.array([255,165, 0]),
#"purple" : np.array([160, 32, 240]),
#"green" : np.array([0, 205, 102])
#"black" : np.array([0,0,0]),
#"white" : np.array([255,255,255]),
#}

rgb_colorset = [
np.array([238, 59, 59]), #red
np.array([142, 229, 238]), #blue
np.array([255,165, 0]), #orange
np.array([160, 32, 240]), #purple
np.array([0, 205, 102]) #green
]

def usage():
  print('usage: faithfulServer.py')
  print
  print('  Starts a server with the parameters in config.json')
  print('  Waits for incoming connections that will send 3 things:')
  print('    1) question')
  print('    2) question id')
  print('    3) input image url')
  print('    4) url to upload output image')

def basename(string):
  """ Returns everything after the last '/' in a string. The string must have at least 1 char after the last '/' """
  index = string.rfind('/')
  if index == -1 or index == len(string)-1:
    print("Can't get basename from {}!".format(string))
    return None
  return string[index+1:]

def get_ext(string):
  """ Returns everything after, and including the last '.' in a string. The string must have at least 1 char after the last '.' """
  index = string.rfind('.')
  if index == -1 or index == len(string)-1:
    print("Can't find extension in {}!".format(string))
    return None
  return string[index:]
 
def remove_ext(string):
  """ Returns everything before the last '.' in a string. The string must have at least 1 char after the last '.' """
  index = string.rfind('.')
  if index == -1 or index == len(string)-1:
    print("Can't find extension in {}!".format(string))
    return None
  return string[:index]

def remove_leading_zeroes(string):
  i = 0

  while string[i] == '0' and i < len(string)-1:
    i += 1

  if string[i] == '0':
    return ''
  else:
    return string[i:]

def get_coco_id_from_fn(fn):
  return remove_leading_zeroes(remove_ext(fn).split('_')[-1])

def download_image(download_dir, url):
  filename =  download_dir + basename(url)
  if filename == download_dir:
    return None

  try:
    Image.open(BytesIO(requests.get(url).content)).save(filename)
  except Exception as e:
    print("Unable to retrieve image: {}".format(url))
    print("Tried to save to file: {}".format(filename))
    print(e)
    return None

  return filename

def upload_image(local_fn, remote_fn, url):
  print('Uploading image {} to {} ...'.format(local_fn,url + remote_fn))

  print('local_fn: {}'.format(local_fn))
  print('remote_fn: {}'.format(remote_fn))
  print('url: {}'.format(url))
  files = {'files' : open(local_fn,'rb')}
  response = requests.post(url+remote_fn, files=files)
  print('upload response: {}'.format(response))
  return response.status_code == requests.codes.ok
  

def evalOne(question, image_fn):
  #TODO
  print('TODO: Eval VQA here')
  return "/not/a/real/pkl/file/path"

def add_segs( im, act_att, seg_colors, segms):
  masks = mask_util.decode(segms)
  for i in xrange(len(segms)):
      # show mask
      if act_att[i] == 0 :
          #this segment not colored
          continue
      
      color_mask     = seg_colors[i]
      color_mask_ori = color_mask #edge same color as fill, for now?
      img = np.ones(im.shape)

      #does nothing ?
      w_ratio = .0
      for c in range(3):
          color_mask[c] = color_mask[c] * (1 - w_ratio) + w_ratio

      #set img colors to color mask
      for c in range(3):
          img[:, :, c] = color_mask[c]
      e = masks[:, :, i]

      #grab contours
      _, contour, _ = cv2.findContours(
          e.copy(), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

      for c in contour:
          polygon = Polygon(
              c.reshape((-1, 2)),
              fill=True, facecolor=color_mask,
              edgecolor=color_mask_ori, linewidth=1.2,
              alpha=0.5)
          plt.gca().add_patch(polygon)

def render_image(question, answer, explanation, segms_list, atts, im, output_fn, source_logits):
  n_words = len(explanation)
  pos = parser.parse(explanation).pos()
  #colorset = [[238, 59, 59],[142, 229, 238], [255,165, 0], [160, 32, 240], [0, 205, 102]]

  next_color = 0
  word_color_list = []
  ok = True
  act_att = np.zeros((atts.shape[1]))
  seg_colors = np.zeros((atts.shape[1],3))

  for w in xrange(len(explanation)):
    #grab attention across all segments for this word
    att = atts[w, :]

    #init colors to black
    color      = None
    word_color = None

    if att.max() > 0.15 and ((pos[w][1] == 'NN' or pos[w][1] == 'JJ' or pos[w][1] == 'NNS')):
      #TODO fix this commented out line
      #if source_logits[w, 1] > source_logits[w, 0]:
          segment_index = att.argmax()
          if act_att[segment_index] == 0: #segment is not already colored
              act_att[segment_index] = 1 #mark as colored

              color = rgb_colorset[next_color]
              seg_colors[segment_index] = color
              word_color                = color

              next_color = (next_color+1)%len(rgb_colorset)
          else:
              #segment with most attention for this word already colored
              #set word to segment's color
              word_color = seg_colors[segment_index]
          ok = True
    #every word will have a color, even if it is black
    word_color_list.append(word_color)


  display_image_in_actual_size(im)
  add_segs(im,  act_att, seg_colors/255.0, segms_list)

  if ok:
    plt.savefig(output_fn,format="jpg")
    rv = output_fn
  else:
    #this cannot happen while above TODO is not fixed
    #no things were colored
    rv = None
  plt.clf()
  return rv, word_color_list

def display_image_in_actual_size(im):
  height, width, depth = im.shape
  dpi = 80 #apparently always 80 with matplotlib
  figsize = width/float(dpi), height/float(dpi)
  fig = plt.figure(figsize=figsize)
  ax = fig.add_axes([0,0,1,1])
  ax.axis('off')
  ax.imshow(im)
  return

def main(config):
  port = config['port']
  host = config['host']
  img_download_dir = config['image_download_directory']
  coco_dataset_dir = config['coco_dataset_directory']
  npz_features_dir = config['npz_features_directory']
  output_dir = config['output_directory']

  #start server
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  if s:
    s.bind((host, port))
    s.listen(3) #at most 3 backlogged questions before refusal
    while True:
      #wait for connections
      print('Waitng for connections ...')
      conn, addr = s.accept()
      if conn:
        print("Accepted connection from {}".format(addr))

        buff = StringIO.StringIO()

        #receive image/question
        print('Waiting for 4 newline characters ...')
        while True:
          data = conn.recv(4096)
          buff.write(data.decode('utf-8'))
          if buff.getvalue().count('\n') == 4: #expecting 4 things
            question      = buff.getvalue().splitlines()[0]
            question_id   = buff.getvalue().splitlines()[1]
            image_get_url = buff.getvalue().splitlines()[2]
            image_put_url = buff.getvalue().splitlines()[3]
            break
        print('received question:    {}'.format(question))
        print('received question_id: {}'.format(question_id))
        print('received image_get_url:   {}'.format(image_get_url))
        print('received image_put_url:   {}'.format(image_put_url))
            
        print('Downloading image ...')
        im_name = download_image(img_download_dir, image_get_url)

        if im_name is not None:
          print('Downloaded image: {}'.format(im_name))
          print('Coco id from image url: {}'.format(get_coco_id_from_fn(basename(im_name))))
          pklfile = evalOne(question, im_name)
          #TODO replace with evalOne output
          pklfile = "/scratch/equas/faithful/VQX_results/19313000.pkl"
          print('Reading pkl file: {}'.format(pklfile))
          print('using this pkl file for now: {}'.format(pklfile))


          savedpkl = cPickle.load(open(pklfile,"r"))
          answer = savedpkl['answer']
          explanation = savedpkl['explanation'].split()
          file_path = savedpkl['file_path']
          question = savedpkl['question']
          atts = savedpkl['att']
          image_id =  savedpkl['img_id']
          source_logits = savedpkl['source_logits']
          VQX_question_id = savedpkl['question_id']


          print('Reading image: {} ...'.format(coco_dataset_dir+file_path))
          im = cv2.imread(coco_dataset_dir + file_path)
          print('Rendering image with segments ...')
          im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
          spatials = np.load(npz_features_dir + os.path.sep + 'coco_val2014' + os.path.sep + str(image_id) + '.npz')['cls_segms']
          segms_list = []
          for cc in xrange(1,3002):
            for jj in xrange(len(spatials[cc])):
              segms_list.append(spatials[cc][jj])

          output_fn, word_colors = render_image(question, answer, explanation, segms_list, atts, im, output_dir + "faithful_seg.jpg", source_logits)
          if output_fn:
            print('Coloring explanation ...')
            for i,color in enumerate(word_colors):
              if color is not None:
                explanation[i] = '<span style="color:rgb({},{},{})">'.format(color[0],color[1],color[2]) + explanation[i] + '</span>'
            explanation[0] = ''.join([explanation[0][0].upper()] + [explanation[0][1:]])
            reply = {}
            reply['answer'] = answer
            reply['explanation'] = ' '.join(explanation)

            #upload image before reply
            ok = upload_image(output_fn, str(question_id), image_put_url)
            if ok:
              print('Success, sending reply ...')
              conn.sendall(json.dumps(reply).encode('utf-8'))
              print('Reply sent: {}'.format(json.dumps(reply)))
            else:
              print('Error uploading image!')
              conn.sendall(b'Error uploading image!')
          else:
            print('Unable to render image!')
            conn.sendall(b'Unable to render image!')
        else:
          print('Unable to get image!')
          conn.sendall(b'Unable to get image!'.encode('utf-8'))
        #finish this request
        conn.close()
      else:
        print('Error accepting connection! Ignoring ...')
  else:
    print('Unable to get socket!')
    sys.exit(1)

if __name__ == '__main__':
  if len(sys.argv) > 1:
    usage()
    sys.exit(0)
  with open("config.json","r") as f:
    config = json.load(f)
    main(config)
