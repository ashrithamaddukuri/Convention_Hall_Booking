package com.conventionhall.booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private Hall hall;

    @Column(name = "event_name", nullable = false, length = 200)
    private String eventName;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Status status;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    // Free-text summary of chosen menu items e.g. "Paneer Tikka, Dal Makhani, Gulab Jamun"
    @Column(name = "menu_summary", length = 1000)
    private String menuSummary;

    // Name of chosen decoration package e.g. "Floral Elegance", null = none
    @Column(name = "decoration_package", length = 100)
    private String decorationPackage;

    @Column(nullable = false)
    private Boolean catering;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Bill bill;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (status     == null) status     = Status.PENDING;
        if (guestCount == null) guestCount = 1;
        if (catering   == null) catering   = false;
    }

    public enum Status { PENDING, CONFIRMED, CANCELLED }
}
