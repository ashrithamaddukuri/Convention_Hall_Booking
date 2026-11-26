package com.conventionhall.booking.controller;

import com.conventionhall.booking.dto.BookingDto;
import com.conventionhall.booking.dto.BookingRequest;
import com.conventionhall.booking.dto.QuoteResponse;
import com.conventionhall.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * GET a cost quote without saving anything.
     * Also tells the caller whether the slot is available.
     * Open to authenticated users only.
     */
    @PostMapping("/quote")
    public ResponseEntity<QuoteResponse> quote(
        @RequestBody BookingRequest request
    ) {
        return ResponseEntity.ok(bookingService.quote(request));
    }

    @PostMapping
    public ResponseEntity<BookingDto> create(
        @AuthenticationPrincipal UserDetails principal,
        @Valid @RequestBody BookingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(bookingService.create(principal.getUsername(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> myBookings(
        @AuthenticationPrincipal UserDetails principal
    ) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingDto> cancel(
        @AuthenticationPrincipal UserDetails principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.cancel(principal.getUsername(), id));
    }
}
