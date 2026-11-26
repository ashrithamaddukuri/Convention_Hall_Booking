package com.conventionhall.booking.controller;

import com.conventionhall.booking.dto.HallDto;
import com.conventionhall.booking.service.HallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    @GetMapping
    public ResponseEntity<List<HallDto>> getActive() {
        return ResponseEntity.ok(hallService.getAllActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HallDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(hallService.getById(id));
    }
}
