package com.conventionhall.booking.dto;

import com.conventionhall.booking.entity.Booking;

import java.time.LocalDateTime;

public record BookingDto(
    Long          id,
    Long          hallId,
    String        hallName,
    String        eventName,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer       guestCount,
    String        menuSummary,
    String        decorationPackage,
    Boolean       catering,
    String        status,
    LocalDateTime createdAt,
    String        userEmail,
    String        userName,
    BillDto       bill
) {
    public static BookingDto from(Booking b) {
        BillDto billDto = (b.getBill() != null) ? BillDto.from(b.getBill()) : null;
        return new BookingDto(
            b.getId(),
            b.getHall().getId(),
            b.getHall().getName(),
            b.getEventName(),
            b.getStartTime(),
            b.getEndTime(),
            b.getGuestCount(),
            b.getMenuSummary(),
            b.getDecorationPackage(),
            b.getCatering(),
            b.getStatus().name(),
            b.getCreatedAt(),
            b.getUser().getEmail(),
            b.getUser().getName(),
            billDto
        );
    }
}
