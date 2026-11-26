package com.conventionhall.booking.service;

import com.conventionhall.booking.dto.BillDto;
import com.conventionhall.booking.dto.BookingRequest;
import com.conventionhall.booking.dto.QuoteResponse;
import com.conventionhall.booking.entity.Bill;
import com.conventionhall.booking.entity.Booking;
import com.conventionhall.booking.entity.Hall;
import com.conventionhall.booking.entity.User;
import com.conventionhall.booking.exception.ResourceNotFoundException;
import com.conventionhall.booking.repository.BillRepository;
import com.conventionhall.booking.repository.BookingRepository;
import com.conventionhall.booking.repository.HallRepository;
import com.conventionhall.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    public  static final BigDecimal CATERING_FLAT = new BigDecimal("2000.00");
    private static final BigDecimal TAX_RATE      = new BigDecimal("0.18");

    private final BillRepository    billRepository;
    private final UserRepository    userRepository;
    private final HallRepository    hallRepository;
    private final BookingRepository bookingRepository;

    // ── Quote (no DB write) ─────────────────────────────────────────────────

    public QuoteResponse buildQuote(BookingRequest req, boolean slotAvailable) {
        Hall hall = hallRepository.findById(req.hallId())
            .orElseThrow(() -> new ResourceNotFoundException("Hall not found: " + req.hallId()));

        Breakdown b = calculate(
            hall, req.startTime(), req.endTime(),
            req.foodCharge(), req.catering(), req.decorationCharge()
        );

        return new QuoteResponse(
            req.hallId(), hall.getName(),
            req.startTime(), req.endTime(),
            req.guestCount(),
            req.menuSummary(),
            req.decorationPackage(),
            req.catering(),
            b.hallCharge, b.foodCharge, b.cateringCharge, b.decorationCharge,
            b.subtotal, b.tax, b.total,
            slotAvailable
        );
    }

    // ── Generate Bill on booking confirmation ───────────────────────────────

    @Transactional
    public Bill generateBill(Booking booking, BigDecimal foodCharge, BigDecimal decorationCharge) {
        Breakdown b = calculate(
            booking.getHall(),
            booking.getStartTime(),
            booking.getEndTime(),
            foodCharge,
            booking.getCatering(),
            decorationCharge
        );

        Bill bill = Bill.builder()
            .booking(booking)
            .hallCharge(b.hallCharge)
            .foodCharge(b.foodCharge)
            .cateringCharge(b.cateringCharge)
            .decorationCharge(b.decorationCharge)
            .amount(b.subtotal)
            .tax(b.tax)
            .total(b.total)
            .paid(false)
            .build();
        return billRepository.save(bill);
    }

    // ── Shared calculation ──────────────────────────────────────────────────

    private Breakdown calculate(Hall hall,
                                LocalDateTime startTime,
                                LocalDateTime endTime,
                                BigDecimal foodCharge,
                                boolean catering,
                                BigDecimal decorationCharge) {
        long minutes     = Duration.between(startTime, endTime).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
            .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal hallCharge = hall.getPricePerHour()
            .multiply(hours).setScale(2, RoundingMode.HALF_UP);

        BigDecimal cateringCharge = catering ? CATERING_FLAT : BigDecimal.ZERO;
        BigDecimal safeFood  = foodCharge       != null ? foodCharge       : BigDecimal.ZERO;
        BigDecimal safeDecor = decorationCharge != null ? decorationCharge : BigDecimal.ZERO;

        BigDecimal subtotal = hallCharge.add(safeFood).add(cateringCharge).add(safeDecor);
        BigDecimal tax      = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total    = subtotal.add(tax);

        return new Breakdown(hallCharge, safeFood, cateringCharge, safeDecor, subtotal, tax, total);
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BillDto> getMyBills(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return billRepository.findByUser(user).stream().map(BillDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BillDto> getAllBills() {
        return billRepository.findAll().stream().map(BillDto::from).toList();
    }

    @Transactional
    public BillDto markPaid(Long billId) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));
        bill.setPaid(true);
        return BillDto.from(billRepository.save(bill));
    }

    private record Breakdown(
        BigDecimal hallCharge, BigDecimal foodCharge,
        BigDecimal cateringCharge, BigDecimal decorationCharge,
        BigDecimal subtotal, BigDecimal tax, BigDecimal total
    ) {}
}
