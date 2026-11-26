package com.conventionhall.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingRequest(
    @NotNull  Long         hallId,
    @NotBlank String       eventName,
    @NotNull  LocalDateTime startTime,          // local datetime — no UTC conversion
    @NotNull  LocalDateTime endTime,
    @NotNull  @Min(1) Integer guestCount,
    String    menuSummary,                      // e.g. "Paneer Tikka, Dal Makhani, Gulab Jamun"
    @NotNull  BigDecimal   foodCharge,          // pre-calculated by frontend
    String    decorationPackage,                // e.g. "Floral Elegance" or null
    @NotNull  BigDecimal   decorationCharge,    // pre-calculated by frontend
    @NotNull  Boolean      catering
) {}
