package com.bbn.xai.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class FolderEntity implements Serializable {
    private String folderUri;
    private List<String> files = new ArrayList<>();
    private List<FolderEntity> folders;

    public List<String> getFiles() {
        return files;
    }

    public void setFiles(List<String> files) {
        this.files = files;
    }

    public List<FolderEntity> getFolders() {
        return folders;
    }

    public void setFolders(List<FolderEntity> folders) {
        this.folders = folders;
    }

    public String getFolderUri() {
        return folderUri;
    }

    public void setFolderUri(String folderUri) {
        this.folderUri = folderUri;
    }
}
