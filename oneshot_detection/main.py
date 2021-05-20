
# Need

# Function: image  => sorted list of 15 features
# Function: (F-sorted, F-irrelevant, F-Neg***) => detector  ***false positive interaction
# Function: detector => score
# ***Function: detector => six good false positives
 
# Inside

# Function: => image to single label {this is the labeler, it has “held out” labels}
# ***Function: => (image DB, image) => candidate false positives)


class ExampleModel:

    def one_shot_train_and_return_list(self, image_path, class_name):
        return list(range(30))

    def improve_classification(self,  class_name, ranked_features, removed_features):
        return None
    
    def score_classification(self):
        return 1.0

    def get_false_positives(self):
        return []

# I envision these to be UI endpoints
# :param arg1: description
# :param arg2: description
# :type arg1: type description
# :type arg1: type description
# :return: return description
# :rtype: the return type description


model = ExampleModel()


def one_shot_train_and_return_list(image_path):
    """

    :param image_path: Path to the image used for one shot detection. Since we know the full set of images

    :return: returns a sorted list of feature indexes
    :rtype: list(int)
    """
    return model.one_shot_train_and_return_list(image_path)


def improve_classification(class_name, ranked_features, removed_features):
    """

    :param class_name: class being improved with ranked and removed features
    :type: string
    :param ranked_features:
    :param removed_features:
    :return: None
    """
    return model.improve_classification(class_name, ranked_features, removed_features)


def score_classification():
    """

    :return: Classification accuracy
    :rtype: float
    """
    return model.score_classification()


# Unsure about this method yet

def get_false_positives(class_name, max_number_of_fps):
    """

    :return:
    :rtype: List of false positive image paths
    """
    return model.get_false_positives(class_name)
