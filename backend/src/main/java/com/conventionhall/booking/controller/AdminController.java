package com.conventionhall.booking.controller;

import com.conventionhall.booking.dto.BillDto;
import com.conventionhall.booking.dto.BookingDto;
import com.conventionhall.booking.dto.HallDto;
import com.conventionhall.booking.service.BillingService;
import com.conventionhall.booking.service.BookingService;
import com.conventionhall.booking.service.HallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final HallService hallService;
    private final BookingService bookingService;
    private final BillingService billingService;

    // ---- Halls ----
    @GetMapping("/halls")
    public ResponseEntity<List<HallDto>> getAllHalls() {
        return ResponseEntity.ok(hallService.getAll());
    }

    @PostMapping("/halls")
    public ResponseEntity<HallDto> createHall(@RequestBody HallDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.create(dto));
    }

    @PutMapping("/halls/{id}")
    public ResponseEntity<HallDto> updateHall(@PathVariable Long id, @RequestBody HallDto dto) {
        return ResponseEntity.ok(hallService.update(id, dto));
    }

    @DeleteMapping("/halls/{id}")
    public ResponseEntity<Void> deleteHall(@PathVariable Long id) {
        hallService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Bookings ----
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // ---- Bills ----
    @GetMapping("/bills")
    public ResponseEntity<List<BillDto>> getAllBills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @PatchMapping("/bills/{id}/pay")
    public ResponseEntity<BillDto> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.markPaid(id));
    }
}
