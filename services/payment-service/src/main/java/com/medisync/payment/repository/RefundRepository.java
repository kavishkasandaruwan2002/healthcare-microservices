package com.medisync.payment.repository;

import com.medisync.payment.entity.Refund;
import com.medisync.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    List<Refund> findByPayment(Payment payment);
}
