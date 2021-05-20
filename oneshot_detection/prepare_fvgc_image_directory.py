import os
import sys
import re

# This script builds the directories for pytorch ImageFolder class
# for the FGVC Aircraft dataset

image_list_file_path = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/fgvc-aircraft-2013b/images.txt'

variant_train_file_path = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/fgvc-aircraft-2013b/data/images_variant_train.txt'

variant_trainval_file_path = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/fgvc-aircraft-2013b/data/images_variant_trainval.txt'

variant_test_file_path = '/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/fgvc-aircraft-2013b/data/images_variant_test.txt'

file_id_to_variant = dict()

output_folder = sys.argv[1]

def get_valid_filename(s):
    s = str(s).strip().replace(' ', '_')
    return re.sub(r'(?u)[^-\w.]', '', s)


for file_path in [variant_train_file_path, variant_trainval_file_path, variant_test_file_path]:
    with open(file_path, 'r') as f:
        for line in [x.strip() for x in f.readlines()]:
            values = line.split(' ')
            file_id_to_variant[values[0]] = ' '.join(values[1:])

with open(image_list_file_path, 'r') as f:
    for file_path in [x.strip() for x in f.readlines()]:
        file_name = os.path.basename(file_path)
        file_id, _ = os.path.splitext(file_name)
        variant = get_valid_filename(file_id_to_variant[file_id])
        variant_dir = os.path.join(output_folder, variant)
        if not os.path.exists(variant_dir):
            os.makedirs(variant_dir)
        symlink_path = os.path.join(variant_dir, file_name)
        if not os.path.exists(symlink_path):
            os.symlink(file_path, symlink_path)

print('Done')

