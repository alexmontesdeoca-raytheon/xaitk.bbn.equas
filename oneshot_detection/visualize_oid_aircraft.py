import sys
import cv2
import os
import json
import numpy as np
from collections import defaultdict

image_folder = sys.argv[1].strip()

anno_mat = json.load(open(sys.argv[2],'r'))

images = []

image_parent_id_to_aeroplane_index = defaultdict(lambda: list())

for index, parent_id in enumerate(anno_mat['anno']['aeroplane']['parentId']):
    image_parent_id_to_aeroplane_index[parent_id].append(index)

aeroplane_id_to_wing_index = defaultdict(lambda: list())

for index, parent_id in enumerate(anno_mat['anno']['wing']['parentId']):
    aeroplane_id_to_wing_index[parent_id].append(index)

aeroplane_id_to_wheel_index = defaultdict(lambda: list())

for index, parent_id in enumerate(anno_mat['anno']['wheel']['parentId']):
    aeroplane_id_to_wheel_index[parent_id].append(index)

aeroplane_id_to_verticalStabilizer_index = defaultdict(lambda: list())

for index, parent_id in enumerate(anno_mat['anno']['verticalStabilizer']['parentId']):
    aeroplane_id_to_verticalStabilizer_index[parent_id].append(index)

aeroplane_id_to_nose_index = defaultdict(lambda: list())

for index, parent_id in enumerate(anno_mat['anno']['nose']['parentId']):
    aeroplane_id_to_nose_index[parent_id].append(index)


model_id_to_model_name = dict()
for i, model_name in enumerate(anno_mat['anno']['meta']['aeroplane']['attribute']['model']):
    model_id_to_model_name[i+1] = model_name

class Image(object):
    def __init__(self):
        self.__id = None
        self.__planes = []
        self.__filename = None

    @staticmethod
    def from_annotation(image_id, annotation):
        image_obj = Image()
        image_obj.__id = image_id
        image_obj.__filename = annotation['image']['name'][image_id-1]
        for index in image_parent_id_to_aeroplane_index[image_id]:
            image_obj.__planes.append(
                Plane.from_annotation(index, annotation)
            )
        return image_obj

    @property
    def planes(self):
        return self.__planes
    
    @property
    def filename(self):
        return self.__filename


class Nose(object):
    def __init__(self):
        self.__id = None
        self.__polygon = None

    @staticmethod
    def from_annotation(index, annotation):
        nose_obj = Nose()
        polygon = annotation['nose']['polygon'][index]
        nose_obj.__polygon = np.array(polygon).transpose().astype(int).reshape((1,-1,2))
        return nose_obj

    @property
    def polygon(self):
        return self.__polygon

class Wing(object):
    def __init__(self):
        self.__id = None
        self.__polygon = None

    @staticmethod
    def from_annotation(index, annotation):
        wing_obj = Wing()
        polygon = annotation['wing']['polygon'][index]
        wing_obj.__polygon = np.array(polygon).transpose().astype(int).reshape((1,-1,2))
        return wing_obj

    @property
    def polygon(self):
        return self.__polygon

class VerticalStabilizer(object):
    def __init__(self):
        self.__id = None
        self.__polygon = None

    @staticmethod
    def from_annotation(index, annotation):
        vs_obj = VerticalStabilizer()
        polygon = annotation['verticalStabilizer']['polygon'][index]
        vs_obj.__polygon = np.array(polygon).transpose().astype(int).reshape((1,-1,2))
        return vs_obj

    @property
    def polygon(self):
        return self.__polygon

class Wheel(object):
    def __init__(self):
        self.__id = None
        self.__polygon = None

    @staticmethod
    def from_annotation(index, annotation):
        wheel_obj = Wheel()
        polygon = annotation['wheel']['polygon'][index]
        wheel_obj.__polygon = np.array(polygon).transpose().astype(int).reshape((1,-1,2))
        return wheel_obj

    @property
    def polygon(self):
        return self.__polygon


class Plane(object):
    def __init__(self):
        self.__id = None
        self.__polygon = None
        self.__model = None
        self.__nose = None
        self.__verticalStabilizer = []
        self.__wing = []
        self.__wheels = []

    @staticmethod
    def from_annotation(index, annotation):
        plane_obj = Plane()
        plane_obj.__id = annotation['aeroplane']['id'][index]

        plane_obj.__model = model_id_to_model_name[annotation['aeroplane']['attribute']['model'][index]]
        polygon = annotation['aeroplane']['polygon'][index]
        plane_obj.__polygon = np.array(polygon).transpose().astype(int).reshape((1,-1,2))
        
        for nose_index in aeroplane_id_to_nose_index[plane_obj.id]:
            plane_obj.__nose = Nose.from_annotation(nose_index, annotation)
            break

        for wing_index in aeroplane_id_to_wing_index[plane_obj.id]:
            plane_obj.__wing.append(
                Wing.from_annotation(wing_index, annotation)
            )

        for vs_index in aeroplane_id_to_verticalStabilizer_index[plane_obj.id]:
            plane_obj.__verticalStabilizer.append(
                VerticalStabilizer.from_annotation(vs_index, annotation)
            )
        for wheel_index in aeroplane_id_to_wheel_index[plane_obj.id]:
            plane_obj.__wheels.append(
                Wheel.from_annotation(wheel_index, annotation)
            )
    
        return plane_obj

    @property
    def id(self):
        return self.__id

    @property
    def model(self):
        return self.__model

    @property
    def polygon(self):
        return self.__polygon

    @property
    def nose(self):
        return self.__nose

    @property
    def wing(self):
        return self.__wing

    @property
    def verticalStabilizer(self):
        return self.__verticalStabilizer
    
    @property
    def wheels(self):
        return self.__wheels

image_objs = []

for id_ in anno_mat['anno']['image']['id']:
    image_objs.append(
        Image.from_annotation(id_, anno_mat['anno'])
    )

for image in image_objs:
    print(image.filename)
    file_path = os.path.join(image_folder, image.filename)
    img = cv2.imread(file_path)
    display_string = ''
    plane_models = []
    for plane in image.planes:
        plane_models.append(plane.model)
        cv2.polylines(img, [plane.polygon], True, (0, 255, 255))
        cv2.polylines(img, [plane.nose.polygon], True, (255, 0, 255))
        for wing in plane.wing:
            cv2.polylines(img, [wing.polygon], True, (128, 0, 255))
        for vs in plane.verticalStabilizer:
            cv2.polylines(img, [vs.polygon], True, (128, 0, 128))
        for wheel in plane.wheels:
            cv2.polylines(img, [wheel.polygon], True, (0, 255, 0))
    display_string = ",".join(plane_models)
    cv2.imshow(display_string, img)
    cv2.waitKey()
    cv2.destroyWindow(display_string)

print('Done')

