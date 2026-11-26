package com.conventionhall.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QuoteResponse(
    Long           hallId,
    String         hallName,
    LocalDateTime  startTime,
    LocalDateTime  endTime,
    Integer        guestCount,
    String         menuSummary,
    String         decorationPackage,
    boolean        catering,
    BigDecimal     hallCharge,
    BigDecimal     foodCharge,
    BigDecimal     cateringCharge,
    BigDecimal     decorationCharge,
    BigDecimal     subtotal,
    BigDecimal     tax,
    BigDecimal     total,
    boolean        slotAvailable
) {}
