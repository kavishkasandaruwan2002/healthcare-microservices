package com.medisync.telemedicine.config;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    @Bean public TopicExchange appointmentExchange(){ return new TopicExchange("appointment.exchange", true, false); }
    @Bean public TopicExchange telemedicineExchange(){ return new TopicExchange("telemedicine.exchange", true, false); }
    @Bean public Queue appointmentConfirmedQueue(){ return new Queue("telemedicine.appointment.confirmed", true); }
    @Bean public Binding appointmentConfirmedBinding(Queue appointmentConfirmedQueue, TopicExchange appointmentExchange){ return BindingBuilder.bind(appointmentConfirmedQueue).to(appointmentExchange).with("appointment.confirmed"); }
    @Bean public MessageConverter messageConverter(){ return new Jackson2JsonMessageConverter(); }
    @Bean public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter mc){ RabbitTemplate rt=new RabbitTemplate(cf); rt.setMessageConverter(mc); return rt; }
    @Bean public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory cf, MessageConverter mc){ SimpleRabbitListenerContainerFactory f=new SimpleRabbitListenerContainerFactory(); f.setConnectionFactory(cf); f.setMessageConverter(mc); return f; }
}
