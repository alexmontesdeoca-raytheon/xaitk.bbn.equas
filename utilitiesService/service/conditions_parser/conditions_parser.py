import re
import json


class ConditionsParser(object):
    """A class for parsing end-state conditions stipulated (in natural language) in a commander's intent."""

    _valid_time_units = ('days', 'hours', 'minutes', 'seconds', 'day', 'hour', 'minute', 'second')

    @classmethod
    def parse(cls, intent_id, conditions_str, delimiter):
        """Parse the given conditions, expressed as a string."""
        raw_conditions = cls._preprocess(conditions_str=conditions_str, delimiter=delimiter)
        conditions = []
        all_errors = []
        for i, raw_condition in enumerate(raw_conditions):
            condition_name = "{intent_id}-endStateCondition-{i}".format(intent_id=intent_id, i=i)
            condition, errors = cls._parse_raw_condition(raw_condition=raw_condition, condition_name=condition_name)
            if condition:
                conditions.append(condition)
            if errors:
                all_errors += errors
        payload = {
            "conditions": conditions,
            "errors": all_errors
        }
        return payload

    @classmethod
    def _preprocess(cls, conditions_str, delimiter):
        """Preprocess the given conditions string to return a list of conditions, each expressed as a sentence."""
        conditions_str = conditions_str.replace('\n', ' ')
        while '  ' in conditions_str:
            conditions_str = conditions_str.replace('  ', ' ')
        raw_conditions = []
        for raw_condition in conditions_str.split(delimiter):
            raw_condition = raw_condition.lstrip().rstrip().rstrip('.')
            if not raw_condition:
                continue
            raw_conditions.append(raw_condition)
        return raw_conditions

    @classmethod
    def _parse_raw_condition(cls, raw_condition, condition_name):
        """Parse the given condition, expressed in natural language as a string."""
        for pattern, method in cls._get_pattern_to_method_map():
            if pattern.search(string=raw_condition):
                condition, errors = method(
                    pattern=pattern,
                    raw_condition=raw_condition,
                    condition_name=condition_name
                )
                break
        else:
            condition, errors = None, ["Condition could not be parsed: '{condition}'".format(condition=raw_condition)]
        return condition, errors

    @classmethod
    def _build_max_duration_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        mission_or_activity_name, value, units = pattern.search(string=raw_condition).groups()
        errors = []
        condition = {"type": "Take Less Than", "name": condition_name}
        if mission_or_activity_name.lower() == 'mission':
            condition["attachTo"] = {"isMission": True, "elementName": None}
        else:
            condition["attachTo"] = {"isMission": False, "elementName": mission_or_activity_name}
        condition["units"] = units if units.endswith('s') else units + 's'
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}' (valid units: {valid_units}): {condition}".format(
                unit=units,
                valid_units=', '.join(cls._valid_time_units),
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_min_duration_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        mission_or_activity_name, value, units = pattern.search(string=raw_condition).groups()
        errors = []
        condition = {"type": "Take More Than", "name": condition_name}
        if mission_or_activity_name.lower() == 'mission':
            condition["attachTo"] = {"isMission": True, "elementName": None}
        else:
            condition["attachTo"] = {"isMission": False, "elementName": mission_or_activity_name}
        condition["units"] = units if units.endswith('s') else units + 's'
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_start_before_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Start Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None[error]
        return condition, None

    @classmethod
    def _build_start_before_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Start Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_end_before_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Finish Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_end_before_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Finish Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_start_after_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Start After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_start_after_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "Start After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_end_after_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "End After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_end_after_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        condition = {
            "type": "End After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": 0,
            "units": 'seconds'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            return None, [error]
        return condition, None

    @classmethod
    def _build_start_after_t_plus_of_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "Start After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's' if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_start_after_t_plus_of_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "Start After T Plus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's' if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_end_before_t_minus_of_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "End Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "endOf": None,
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_end_before_t_minus_of_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type":"End Before T Minus Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "startOf": None,
            "endOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_start_within_x_of_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "Start Within X Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "withinXOfStartOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "withinXOfEndOf": None,
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_start_within_x_of_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "Start Within X Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "withinXOfStartOf": None,
            "withinXOfEndOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_end_within_x_of_start_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "End Within X Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "withinXOfStartOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "withinXOfEndOf": None,
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _build_end_within_x_of_end_temporal_constraint(cls, pattern, raw_condition, condition_name):
        """Return a temporal constraint."""
        constrained_element, value, units, anchor_element = pattern.search(string=raw_condition).groups()
        anchor_element_is_mission = anchor_element.lower() == 'mission'
        errors = []
        condition = {
            "type": "End Within X Of",
            "name": condition_name,
            "attachTo": {"isMission": False, "elementName": constrained_element},
            "withinXOfStartOf": None,
            "withinXOfEndOf": {
                "isMission": anchor_element_is_mission,
                "elementName": anchor_element if not anchor_element_is_mission else None
            },
            "value": None,  # Set below
            "units": units if units.endswith('s') else units + 's'
        }
        if constrained_element == anchor_element:
            error = "Activity/event '{name}' is temporally constrained relative to itself: {condition}".format(
                name=constrained_element,
                condition=raw_condition
            )
            errors.append(error)
        if units not in cls._valid_time_units:
            error = "Invalid time unit '{unit}': {condition}".format(
                unit=units,
                condition=raw_condition
            )
            errors.append(error)
        try:
            condition["value"] = int(value)
        except ValueError:
            error = "Invalid value '{value}' for time unit (must be integer): {condition}".format(
                value=value,
                condition=raw_condition
            )
            errors.append(error)
        if errors:
            return None, errors
        return condition, None

    @classmethod
    def _get_pattern_to_method_map(cls):
        pattern_to_method_map = (
            (
                re.compile('(.+?) must take less than (.+?) (.+?)$'),
                cls._build_max_duration_temporal_constraint
            ),
            (
                re.compile('(.+?) must take at least (.+?) (.+?)$'),
                cls._build_min_duration_temporal_constraint
            ),
            (
                re.compile('(.+?) must start before (.+?) starts'),
                cls._build_start_before_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must start before (.+?) ends'),
                cls._build_start_before_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must end before (.+?) starts'),
                cls._build_end_before_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must end before (.+?) ends'),
                cls._build_end_before_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must start after (.+?) starts'),
                cls._build_start_after_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must start after (.+?) ends'),
                cls._build_start_after_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must end after (.+?) starts'),
                cls._build_end_after_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must end after (.+?) ends'),
                cls._build_end_after_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must start at least (.+?) (.+?) after (.+?) starts'),
                cls._build_start_after_t_plus_of_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must start at least (.+?) (.+?) after (.+?) ends'),
                cls._build_start_after_t_plus_of_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must end at least (.+?) (.+?) before (.+?) starts'),
                cls._build_end_before_t_minus_of_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must end at least (.+?) (.+?) before (.+?) ends'),
                cls._build_end_before_t_minus_of_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must start within (.+?) (.+?) of (.+?) starting'),
                cls._build_start_within_x_of_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must start within (.+?) (.+?) of (.+?) ending'),
                cls._build_start_within_x_of_end_temporal_constraint
            ),
            (
                re.compile('(.+?) must end within (.+?) (.+?) of (.+?) starting'),
                cls._build_end_within_x_of_start_temporal_constraint
            ),
            (
                re.compile('(.+?) must end within (.+?) (.+?) of (.+?) ending'),
                cls._build_end_within_x_of_end_temporal_constraint
            ),
        )
        return pattern_to_method_map

    @classmethod
    def test(cls):
        _conditions_str = (
            "Mission must take less than 30 minutes.; Prep must start within 10 minutes of mission starting.; "
            "Bake must take less than 20 minutes.; Bake must start after Prep ends.; "
            "Bake must start within 5 minutes of Prep ending.; "
            "Deliver must end before Receive Payment starts.; Payment must end before mission ends.; "
        )
        print("\nParsing the following end-state conditions:")
        print('\n"{end_state_conditions}"'.format(end_state_conditions=_conditions_str))
        payload = cls.parse(intent_id='Pizza', conditions_str=_conditions_str, delimiter=';')
        conditions, errors = payload["conditions"], payload["errors"]
        if errors:
            print("\n\033[91mError!")
            for error in errors:
                print("\n{error}".format(error=error))
            print("\033[0m")
            return
        print("\n\033[92mSuccess!")
        for i, condition in enumerate(conditions):
            print("\nCondition #{i}:\n".format(i=i+1))
            print(json.dumps(obj=condition, indent=4, sort_keys=True))
        print("\033[0m")


if __name__ == '__main__':
    # Test using a set of example conditions in the Pizza domain, with printout to the console
    ConditionsParser.test()
