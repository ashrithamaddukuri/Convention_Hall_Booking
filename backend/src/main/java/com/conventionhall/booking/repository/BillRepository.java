package com.conventionhall.booking.repository;

import com.conventionhall.booking.entity.Bill;
import com.conventionhall.booking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBookingId(Long bookingId);

    @Query("""
        SELECT bi FROM Bill bi
        JOIN bi.booking b
        WHERE b.user = :user
        ORDER BY bi.issuedAt DESC
        """)
    List<Bill> findByUser(@Param("user") User user);
}
