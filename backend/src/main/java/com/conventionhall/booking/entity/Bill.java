package com.conventionhall.booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal tax;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private Boolean paid;

    @Column(name = "hall_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal hallCharge;

    @Column(name = "food_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal foodCharge;

    @Column(name = "catering_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal cateringCharge;

    @Column(name = "decoration_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal decorationCharge;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @PrePersist
    void prePersist() {
        issuedAt = LocalDateTime.now();
        if (paid == null) paid = false;
    }
}
