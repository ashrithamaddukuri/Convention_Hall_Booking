package com.conventionhall.booking.repository;

import com.conventionhall.booking.entity.Booking;
import com.conventionhall.booking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findAllByOrderByCreatedAtDesc();

    /**
     * Check for overlapping bookings for a given hall, excluding a booking id (useful for updates).
     * Overlap condition: existing.startTime < newEnd AND existing.endTime > newStart
     */
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.hall.id = :hallId
          AND b.id <> :excludeId
          AND b.status <> 'CANCELLED'
          AND b.startTime < :endTime
          AND b.endTime > :startTime
        """)
    boolean existsOverlap(
        @Param("hallId")    Long hallId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime")   LocalDateTime endTime,
        @Param("excludeId") Long excludeId
    );

    @Query("""
        SELECT b FROM Booking b
        WHERE b.hall.id = :hallId
          AND b.status <> 'CANCELLED'
          AND b.startTime >= :from
          AND b.endTime <= :to
        """)
    List<Booking> findByHallAndRange(
        @Param("hallId") Long hallId,
        @Param("from")   LocalDateTime from,
        @Param("to")     LocalDateTime to
    );
}
