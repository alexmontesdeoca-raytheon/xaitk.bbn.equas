package com.bbn.xai.config;

/**
 * Application constants.
 */
public final class Constants {

    // Regex for acceptable logins
    public static final String LOGIN_REGEX = "^[_'.@A-Za-z0-9-]*$";

    public static final String FILE_REGEX = "^[_'.@A-Za-z0-9-]*$";
    public static final String ALLOWSPACE_REGEX = "^[_'.@A-Za-z0-9-\\s]*$";  // Allow spaces
    public static final String QUESTION_ID = "[_a-zA-Z0-9\\-\\.]+"; // Alphanumeric (a-zA-z0-9), underscore, hyphen or period.

    public static final String SYSTEM_ACCOUNT = "system";
    public static final String ANONYMOUS_USER = "anonymoususer";
    public static final String DEFAULT_LANGUAGE = "en";

    private Constants() {
    }
}
