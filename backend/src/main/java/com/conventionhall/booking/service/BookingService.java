package com.conventionhall.booking.service;

import com.conventionhall.booking.dto.BookingDto;
import com.conventionhall.booking.dto.BookingRequest;
import com.conventionhall.booking.dto.QuoteResponse;
import com.conventionhall.booking.entity.*;
import com.conventionhall.booking.exception.BadRequestException;
import com.conventionhall.booking.exception.ResourceNotFoundException;
import com.conventionhall.booking.repository.BookingRepository;
import com.conventionhall.booking.repository.HallRepository;
import com.conventionhall.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HallRepository    hallRepository;
    private final UserRepository    userRepository;
    private final BillingService    billingService;

    // ── Quote ───────────────────────────────────────────────────────────────

    public QuoteResponse quote(BookingRequest req) {
        validateTimes(req);
        boolean available = !bookingRepository.existsOverlap(
            req.hallId(), req.startTime(), req.endTime(), -1L);
        return billingService.buildQuote(req, available);
    }

    // ── Confirm ─────────────────────────────────────────────────────────────

    @Transactional
    public BookingDto create(String email, BookingRequest req) {
        validateTimes(req);

        Hall hall = hallRepository.findById(req.hallId())
            .orElseThrow(() -> new ResourceNotFoundException("Hall not found: " + req.hallId()));
        if (!hall.getActive())
            throw new BadRequestException("Hall is not available for booking");

        if (bookingRepository.existsOverlap(hall.getId(), req.startTime(), req.endTime(), -1L))
            throw new BadRequestException("Hall is already booked for the selected time slot");

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Booking booking = Booking.builder()
            .user(user)
            .hall(hall)
            .eventName(req.eventName())
            .startTime(req.startTime())
            .endTime(req.endTime())
            .guestCount(req.guestCount())
            .menuSummary(req.menuSummary())
            .decorationPackage(req.decorationPackage())
            .catering(req.catering() != null && req.catering())
            .status(Booking.Status.CONFIRMED)
            .build();
        booking = bookingRepository.save(booking);

        billingService.generateBill(booking, req.foodCharge(), req.decorationCharge());

        return BookingDto.from(bookingRepository.findById(booking.getId()).orElseThrow());
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BookingDto> getMyBookings(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return bookingRepository.findByUserOrderByCreatedAtDesc(user)
            .stream().map(BookingDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(BookingDto::from).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto getById(Long id) {
        return BookingDto.from(bookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id)));
    }

    @Transactional
    public BookingDto cancel(String email, Long id) {
        Booking booking = findOrThrow(id);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        if (!isAdmin && !booking.getUser().getId().equals(user.getId()))
            throw new BadRequestException("Not authorized to cancel this booking");
        if (booking.getStatus() == Booking.Status.CANCELLED)
            throw new BadRequestException("Booking is already cancelled");
        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);
        // Re-fetch so all lazy associations (user, hall, bill) are loaded within the transaction
        return BookingDto.from(bookingRepository.findById(id).orElseThrow());
    }

    private void validateTimes(BookingRequest req) {
        if (req.endTime() == null || !req.endTime().isAfter(req.startTime()))
            throw new BadRequestException("End time must be after start time");
    }

    private Booking findOrThrow(Long id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));
    }
}
