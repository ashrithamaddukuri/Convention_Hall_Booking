package com.conventionhall.booking.repository;

import com.conventionhall.booking.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HallRepository extends JpaRepository<Hall, Long> {
    List<Hall> findByActiveTrue();
}
