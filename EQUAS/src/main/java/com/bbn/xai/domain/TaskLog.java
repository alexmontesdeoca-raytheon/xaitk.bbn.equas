package com.bbn.xai.domain;

import java.util.ArrayList;
import java.util.List;


public class TaskLog {
    public List<TaskEntry> items = new ArrayList<>();
    private TaskEntry previousTask;
    public void endTask() {
        if (this.previousTask != null && this.previousTask.endTime == 0) {
            this.previousTask.endTask();
        }
    }
    public TaskEntry startTask(String taskName) {
        if (this.previousTask != null) {
            this.previousTask.endTask();
        }
        TaskEntry newTask = new TaskEntry(taskName);
        this.previousTask = newTask;
        this.items.add(newTask);
        return newTask;
    }

    public static class TaskEntry {
        public String name;
        private long startTime = System.currentTimeMillis();
        private long endTime;
        TaskEntry(String name) {
            this.name = name;
        }
        public void endTask() {
            this.endTime = System.currentTimeMillis();
        }
        public long getDurationMs() {
            return this.endTime - this.startTime;
        }
    }
}
