package com.conventionhall.booking.service;

import com.conventionhall.booking.dto.HallDto;
import com.conventionhall.booking.entity.Hall;
import com.conventionhall.booking.exception.ResourceNotFoundException;
import com.conventionhall.booking.repository.HallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;

    public List<HallDto> getAllActive() {
        return hallRepository.findByActiveTrue().stream().map(HallDto::from).toList();
    }

    public List<HallDto> getAll() {
        return hallRepository.findAll().stream().map(HallDto::from).toList();
    }

    public HallDto getById(Long id) {
        return HallDto.from(findOrThrow(id));
    }

    @Transactional
    public HallDto create(HallDto dto) {
        Hall hall = Hall.builder()
            .name(dto.name())
            .location(dto.location())
            .capacity(dto.capacity())
            .pricePerHour(dto.pricePerHour())
            .description(dto.description())
            .imageUrl(dto.imageUrl())
            .active(dto.active() != null ? dto.active() : true)
            .build();
        return HallDto.from(hallRepository.save(hall));
    }

    @Transactional
    public HallDto update(Long id, HallDto dto) {
        Hall hall = findOrThrow(id);
        if (dto.name()         != null) hall.setName(dto.name());
        if (dto.location()     != null) hall.setLocation(dto.location());
        if (dto.capacity()     != null) hall.setCapacity(dto.capacity());
        if (dto.pricePerHour() != null) hall.setPricePerHour(dto.pricePerHour());
        if (dto.description()  != null) hall.setDescription(dto.description());
        if (dto.imageUrl()     != null) hall.setImageUrl(dto.imageUrl());
        if (dto.active()       != null) hall.setActive(dto.active());
        return HallDto.from(hallRepository.save(hall));
    }

    @Transactional
    public void delete(Long id) {
        Hall hall = findOrThrow(id);
        hall.setActive(false);
        hallRepository.save(hall);
    }

    private Hall findOrThrow(Long id) {
        return hallRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hall not found: " + id));
    }
}
