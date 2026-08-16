package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comment")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_item_id", nullable = false)
    private WorkItem workItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private AppUser author;

    @Column(columnDefinition = "text", nullable = false)
    private String body;

    // null = a regular comment. Populated = anchored to a moment in a video
    // attachment (milliseconds) - see the video-editing discussion: this is
    // what lets "at 0:47, tighten this cut" be a first-class comment instead
    // of a special case bolted onto a video-only table.
    @Column(name = "timecode_ms")
    private Long timecodeMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Comment() {
        // JPA
    }

    public Comment(WorkItem workItem, AppUser author, String body) {
        this.workItem = workItem;
        this.author = author;
        this.body = body;
    }

    public UUID getId() {
        return id;
    }

    public WorkItem getWorkItem() {
        return workItem;
    }

    public AppUser getAuthor() {
        return author;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Long getTimecodeMs() {
        return timecodeMs;
    }

    public void setTimecodeMs(Long timecodeMs) {
        this.timecodeMs = timecodeMs;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
