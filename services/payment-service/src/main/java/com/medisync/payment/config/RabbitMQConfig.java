package com.medisync.payment.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String APPOINTMENT_EXCHANGE = "appointment.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String PAYMENT_APPOINTMENT_CONFIRMED_QUEUE = "payment.appointment.confirmed";
    public static final String APPOINTMENT_CONFIRMED_ROUTING_KEY = "appointment.confirmed";
    public static final String PAYMENT_COMPLETED_ROUTING_KEY = "payment.completed";
    public static final String PAYMENT_FAILED_ROUTING_KEY = "payment.failed";

    @Bean
    public TopicExchange appointmentExchange() {
        return new TopicExchange(APPOINTMENT_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE, true, false);
    }

    @Bean
    public Queue paymentAppointmentConfirmedQueue() {
        return new Queue(PAYMENT_APPOINTMENT_CONFIRMED_QUEUE, true);
    }

    @Bean
    public Binding paymentAppointmentBinding(
            Queue paymentAppointmentConfirmedQueue,
            TopicExchange appointmentExchange) {
        return BindingBuilder
                .bind(paymentAppointmentConfirmedQueue)
                .to(appointmentExchange)
                .with(APPOINTMENT_CONFIRMED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }
}
