Currently we have two aircraft datasets:

OID:Aircraft Benchmark
http://www.robots.ox.ac.uk/~vgg/data/oid/

FGVC-Aircraft Benchmark
http://www.robots.ox.ac.uk/~vgg/data/fgvc-aircraft/


Data used by network dissection code:

/nfs/mercury-12/u119/users/jfaschin-ad/src/xai/dissect/docker/torch_cache.tar.gz
The above should unzip to /root/.cache/ in the container

The rest should should be extracted in the folder mentioned in the Dockerfile
/nfs/mercury-12/u119/users/jfaschin-ad/src/xai/dissect/docker/datasets.tar.gz

/nfs/mercury-12/u119/users/jfaschin-ad/src/xai/dissect/docker/oid_small.tar.gz

/nfs/mercury-12/u119/users/jfaschin-ad/src/xai/dissect/docker/test-gpu.py


These are the full resolution plane datasets:
/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/fgvc-aircraft-2013b/pytorch_input_split

/nfs/raid66/u11/users/jfaschin/3rd_party_datasets/oid-aircraft-beta-1/data/pytorch_input