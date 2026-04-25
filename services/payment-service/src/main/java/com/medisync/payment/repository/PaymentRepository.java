package com.medisync.payment.repository;

import com.medisync.payment.entity.Payment;
import com.medisync.payment.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByAppointmentId(UUID appointmentId);
    Optional<Payment> findByStripePaymentIntentId(String intentId);
    Optional<Payment> findByStripeSubscriptionId(String subscriptionId);
    Optional<Payment> findFirstByStripeCustomerIdOrderByCreatedAtDesc(String customerId);
    Page<Payment> findByPatientId(UUID patientId, Pageable p);
    Page<Payment> findByStatus(PaymentStatus status, Pageable p);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:patientId IS NULL OR p.patientId = :patientId)")
    Page<Payment> findAllWithFilters(
            @Param("status") PaymentStatus status,
            @Param("patientId") UUID patientId,
            Pageable pageable);

    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal calculateTotalRevenue();
}
