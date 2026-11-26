package com.conventionhall.booking.dto;

import com.conventionhall.booking.entity.Bill;
import com.conventionhall.booking.entity.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BillDto(
    Long          id,
    Long          bookingId,
    String        hallName,
    String        eventName,
    Integer       guestCount,
    String        menuSummary,
    String        decorationPackage,
    Boolean       catering,
    BigDecimal    hallCharge,
    BigDecimal    foodCharge,
    BigDecimal    cateringCharge,
    BigDecimal    decorationCharge,
    BigDecimal    amount,
    BigDecimal    tax,
    BigDecimal    total,
    Boolean       paid,
    LocalDateTime issuedAt
) {
    public static BillDto from(Bill b) {
        Booking bk = b.getBooking();
        return new BillDto(
            b.getId(),
            bk.getId(),
            bk.getHall().getName(),
            bk.getEventName(),
            bk.getGuestCount(),
            bk.getMenuSummary(),
            bk.getDecorationPackage(),
            bk.getCatering(),
            b.getHallCharge(),
            b.getFoodCharge(),
            b.getCateringCharge(),
            b.getDecorationCharge(),
            b.getAmount(),
            b.getTax(),
            b.getTotal(),
            b.getPaid(),
            b.getIssuedAt()
        );
    }
}
