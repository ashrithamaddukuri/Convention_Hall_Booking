package com.conventionhall.booking.dto;

import com.conventionhall.booking.entity.Hall;

import java.math.BigDecimal;

public record HallDto(
    Long id,
    String name,
    String location,
    Integer capacity,
    BigDecimal pricePerHour,
    String description,
    String imageUrl,
    Boolean active
) {
    public static HallDto from(Hall h) {
        return new HallDto(
            h.getId(), h.getName(), h.getLocation(),
            h.getCapacity(), h.getPricePerHour(),
            h.getDescription(), h.getImageUrl(), h.getActive()
        );
    }
}
