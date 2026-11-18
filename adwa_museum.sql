--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: question_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_type AS ENUM (
    'multiple-choice',
    'text',
    'rating',
    'yes-no',
    'emoji-rating'
);


ALTER TYPE public.question_type OWNER TO postgres;

--
-- Name: response_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.response_status AS ENUM (
    'started',
    'completed',
    'abandoned'
);


ALTER TYPE public.response_status OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advertisement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advertisement (
    ad_id integer NOT NULL,
    ad_title text,
    ad_description text
);


ALTER TABLE public.advertisement OWNER TO postgres;

--
-- Name: advertisements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advertisements (
    ad_id integer NOT NULL,
    title character varying(255) NOT NULL,
    title_am character varying(255),
    image_url text,
    link_url text,
    "position" character varying(50),
    is_active boolean DEFAULT true,
    description text,
    description_am text,
    start_date date,
    end_date date,
    category character varying(50),
    discount character varying(50),
    animation jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.advertisements OWNER TO postgres;

--
-- Name: advertisements_ad_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.advertisements_ad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.advertisements_ad_id_seq OWNER TO postgres;

--
-- Name: advertisements_ad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.advertisements_ad_id_seq OWNED BY public.advertisements.ad_id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    module character varying(255) NOT NULL,
    target_id integer,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: booking_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_groups (
    group_id character varying(255) NOT NULL,
    group_name character varying(255),
    group_leader_email character varying(255),
    total_members integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.booking_groups OWNER TO postgres;

--
-- Name: bought_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bought_services (
    id character(36) NOT NULL,
    ticket_booking_id character(36),
    service_id integer,
    quantity integer DEFAULT 1
);


ALTER TABLE public.bought_services OWNER TO postgres;

--
-- Name: bought_ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bought_ticket (
    ticket_booking_id character varying(255) NOT NULL,
    visit_date date,
    email character varying(255),
    paid_amount numeric(10,2),
    total_tickets integer,
    walkin character varying(6) DEFAULT 'no'::character varying,
    group_id character varying(255),
    chapa_tx_ref character varying(255),
    status character varying(50),
    is_logged boolean DEFAULT false,
    bought_date date DEFAULT CURRENT_DATE,
    discount_breakdown jsonb
);


ALTER TABLE public.bought_ticket OWNER TO postgres;

--
-- Name: bought_ticket_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bought_ticket_types (
    type_id character varying(255) NOT NULL,
    ticket_booking_id character varying(255),
    event_booking_id character varying(255),
    status character varying(50),
    ticket_id integer,
    unit_price numeric(10,2),
    discount_percent numeric(5,2) DEFAULT 0
);


ALTER TABLE public.bought_ticket_types OWNER TO postgres;

--
-- Name: contact_form; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_form (
    form_id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    subject character varying(255),
    message text
);


ALTER TABLE public.contact_form OWNER TO postgres;

--
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department (
    id integer NOT NULL,
    department character varying(255) NOT NULL,
    status character varying(255)
);


ALTER TABLE public.department OWNER TO postgres;

--
-- Name: department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_id_seq OWNER TO postgres;

--
-- Name: department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_id_seq OWNED BY public.department.id;


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_verifications_id_seq OWNER TO postgres;

--
-- Name: email_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_verifications_id_seq OWNED BY public.email_verifications.id;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    user_id integer NOT NULL,
    role_id integer,
    department character varying(255),
    status character varying(255)
);


ALTER TABLE public.employee OWNER TO postgres;

--
-- Name: event_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_event_id_seq OWNER TO postgres;

--
-- Name: event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event (
    event_id integer DEFAULT nextval('public.event_event_id_seq'::regclass) NOT NULL,
    title character varying(255),
    description text,
    date date,
    start_time time without time zone,
    end_time time without time zone,
    no_of_attendee integer,
    status character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    image_name character varying(255),
    image_path character varying(255),
    image_type character varying(50),
    is_deleted boolean DEFAULT false,
    category_id integer NOT NULL,
    venue_id integer NOT NULL,
    title_am character varying(255),
    description_am text
);


ALTER TABLE public.event OWNER TO postgres;

--
-- Name: event_bought_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_bought_tickets (
    type_id character varying(255) NOT NULL,
    event_booking_id character varying(255),
    status character varying(50),
    ticket_id integer
);


ALTER TABLE public.event_bought_tickets OWNER TO postgres;

--
-- Name: event_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_category (
    id integer NOT NULL,
    category character varying(255) NOT NULL,
    status character varying(10) NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    category_am character varying(255),
    CONSTRAINT event_category_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.event_category OWNER TO postgres;

--
-- Name: event_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_category_id_seq OWNER TO postgres;

--
-- Name: event_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_category_id_seq OWNED BY public.event_category.id;


--
-- Name: event_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_info (
    event_booking_id character varying(255) NOT NULL,
    event_id integer,
    full_name character varying(255),
    email character varying(255),
    phone_no character varying(255),
    ticket_no integer,
    paid_amount numeric(10,2),
    bought_at timestamp with time zone,
    attendance character varying(255),
    walkin character varying DEFAULT 'no'::character varying,
    is_logged boolean DEFAULT false
);


ALTER TABLE public.event_info OWNER TO postgres;

--
-- Name: event_ticket_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_ticket_types (
    ticket_id integer NOT NULL,
    event_id integer,
    type character varying(255),
    price numeric,
    description text,
    feature text,
    ticket_limit integer,
    status character varying(50),
    is_deleted boolean DEFAULT false,
    type_am character varying(255),
    description_am text,
    features_am text
);


ALTER TABLE public.event_ticket_types OWNER TO postgres;

--
-- Name: event_ticket_types_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_ticket_types_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_ticket_types_ticket_id_seq OWNER TO postgres;

--
-- Name: event_ticket_types_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_ticket_types_ticket_id_seq OWNED BY public.event_ticket_types.ticket_id;


--
-- Name: event_ticket_types_ticket_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.event_ticket_types ALTER COLUMN ticket_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.event_ticket_types_ticket_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facilities (
    id integer NOT NULL,
    service_id integer,
    name character varying(255),
    description text,
    capacity integer,
    price_per_hour numeric,
    img_name character varying(255),
    img_path text,
    img_type character varying(50),
    status character varying(255)
);


ALTER TABLE public.facilities OWNER TO postgres;

--
-- Name: facility_facility_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_facility_items (
    id integer NOT NULL,
    facility_id integer,
    facility_item_id integer
);


ALTER TABLE public.facility_facility_items OWNER TO postgres;

--
-- Name: facility_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facility_items (
    id integer NOT NULL,
    name character varying(255),
    description text,
    status character varying(20)
);


ALTER TABLE public.facility_items OWNER TO postgres;

--
-- Name: feedback_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback_responses (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    session_id text,
    language character(2) DEFAULT 'en'::bpchar NOT NULL,
    status public.response_status DEFAULT 'completed'::public.response_status NOT NULL,
    completed boolean DEFAULT true NOT NULL,
    overall_rating numeric(3,2),
    respondent_meta jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feedback_responses OWNER TO postgres;

--
-- Name: feedback_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_responses_id_seq OWNER TO postgres;

--
-- Name: feedback_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_responses_id_seq OWNED BY public.feedback_responses.id;


--
-- Name: group_discounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_discounts (
    discount_id integer NOT NULL,
    ticket_id integer,
    min_group_size integer NOT NULL,
    discount_percent numeric(5,2) NOT NULL
);


ALTER TABLE public.group_discounts OWNER TO postgres;

--
-- Name: group_discounts_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_discounts_discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_discounts_discount_id_seq OWNER TO postgres;

--
-- Name: group_discounts_discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_discounts_discount_id_seq OWNED BY public.group_discounts.discount_id;


--
-- Name: image_galleries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_galleries (
    id integer NOT NULL,
    page_name character varying(50) NOT NULL,
    section_name character varying(100) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_type character varying(20) NOT NULL,
    alt_text character varying(200),
    caption text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title_am character varying(250),
    description_am text
);


ALTER TABLE public.image_galleries OWNER TO postgres;

--
-- Name: image_galleries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_galleries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.image_galleries_id_seq OWNER TO postgres;

--
-- Name: image_galleries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_galleries_id_seq OWNED BY public.image_galleries.id;


--
-- Name: journey_timeline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journey_timeline (
    id integer NOT NULL,
    date date NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    image_url character varying(500),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title_am character varying(200),
    description_am text
);


ALTER TABLE public.journey_timeline OWNER TO postgres;

--
-- Name: journey_timeline_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.journey_timeline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.journey_timeline_id_seq OWNER TO postgres;

--
-- Name: journey_timeline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.journey_timeline_id_seq OWNED BY public.journey_timeline.id;


--
-- Name: mission_vision_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mission_vision_values (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title_am character varying(200),
    description_am text
);


ALTER TABLE public.mission_vision_values OWNER TO postgres;

--
-- Name: mission_vision_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mission_vision_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mission_vision_values_id_seq OWNER TO postgres;

--
-- Name: mission_vision_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mission_vision_values_id_seq OWNED BY public.mission_vision_values.id;


--
-- Name: museum_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.museum_info (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    setting_type character varying(20) DEFAULT 'text'::character varying,
    description character varying(200),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    setting_key_am character varying(200),
    setting_value_am text,
    description_am text
);


ALTER TABLE public.museum_info OWNER TO postgres;

--
-- Name: museum_info_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.museum_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.museum_info_id_seq OWNER TO postgres;

--
-- Name: museum_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.museum_info_id_seq OWNED BY public.museum_info.id;


--
-- Name: page_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.page_content (
    id integer NOT NULL,
    page_name character varying(50) NOT NULL,
    section_name character varying(100) NOT NULL,
    title character varying(500),
    subtitle character varying(500),
    content text,
    background_image character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title_am character varying(500),
    subtitle_am character varying(500),
    content_am text
);


ALTER TABLE public.page_content OWNER TO postgres;

--
-- Name: page_content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.page_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_content_id_seq OWNER TO postgres;

--
-- Name: page_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.page_content_id_seq OWNED BY public.page_content.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partners (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    logo_url character varying(500),
    website_url character varying(500),
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name_am character varying(200)
);


ALTER TABLE public.partners OWNER TO postgres;

--
-- Name: partners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partners_id_seq OWNER TO postgres;

--
-- Name: partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partners_id_seq OWNED BY public.partners.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: pending_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_payments (
    tx_ref character varying(100) NOT NULL,
    meta json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pending_payments OWNER TO postgres;

--
-- Name: pending_payments_staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_payments_staff (
    tx_ref character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    visit_date date NOT NULL,
    ticket_info json NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'ETB'::character varying NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pending_payments_staff OWNER TO postgres;

--
-- Name: pending_table_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_table_service (
    id integer NOT NULL,
    request_id integer NOT NULL,
    email character varying(255) NOT NULL,
    tx_ref character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pending_table_service OWNER TO postgres;

--
-- Name: pending_table_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pending_table_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_table_service_id_seq OWNER TO postgres;

--
-- Name: pending_table_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pending_table_service_id_seq OWNED BY public.pending_table_service.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    permission_id integer NOT NULL,
    name character varying(255),
    title character varying(255),
    url character varying(255),
    icon character varying(255),
    section character varying(255)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.permissions ALTER COLUMN permission_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.permissions_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: question_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_options (
    id integer NOT NULL,
    question_id integer NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    ordinal integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.question_options OWNER TO postgres;

--
-- Name: question_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_options_id_seq OWNER TO postgres;

--
-- Name: question_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_options_id_seq OWNED BY public.question_options.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens2 (
    jti uuid NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    previous_jti uuid,
    replaced_by_jti uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL
);


ALTER TABLE public.refresh_tokens2 OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: request_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_dates (
    id integer NOT NULL,
    request_id integer NOT NULL,
    date date NOT NULL
);


ALTER TABLE public.request_dates OWNER TO postgres;

--
-- Name: request_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_dates_id_seq OWNER TO postgres;

--
-- Name: request_dates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_dates_id_seq OWNED BY public.request_dates.id;


--
-- Name: request_timeslot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_timeslot (
    id integer NOT NULL,
    request_date_id integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL
);


ALTER TABLE public.request_timeslot OWNER TO postgres;

--
-- Name: request_timeslot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_timeslot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_timeslot_id_seq OWNER TO postgres;

--
-- Name: request_timeslot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_timeslot_id_seq OWNED BY public.request_timeslot.id;


--
-- Name: response_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.response_answers (
    id integer NOT NULL,
    response_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    answer_number numeric,
    answer_bool boolean,
    answer_json jsonb,
    skipped boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.response_answers OWNER TO postgres;

--
-- Name: response_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.response_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.response_answers_id_seq OWNER TO postgres;

--
-- Name: response_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.response_answers_id_seq OWNED BY public.response_answers.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer,
    permission_id integer
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer DEFAULT nextval('public.roles_role_id_seq'::regclass) NOT NULL,
    name character varying(255)
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: service_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_category (
    id integer NOT NULL,
    category character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(10) DEFAULT 'active'::character varying,
    is_deleted boolean DEFAULT false NOT NULL,
    category_am character varying(255),
    description_am text,
    CONSTRAINT service_category_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.service_category OWNER TO postgres;

--
-- Name: service_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_category_id_seq OWNER TO postgres;

--
-- Name: service_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_category_id_seq OWNED BY public.service_category.id;


--
-- Name: service_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_facility (
    id integer NOT NULL,
    category_id integer NOT NULL,
    venue_id integer NOT NULL,
    price numeric(10,2) NOT NULL,
    currency character varying(10) NOT NULL,
    duration character varying(20) NOT NULL,
    features text,
    capacity integer,
    status character varying(10) DEFAULT 'active'::character varying,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    description text,
    video text,
    description_am text,
    features_am text,
    CONSTRAINT service_facility_currency_check CHECK (((currency)::text = ANY ((ARRAY['ETB'::character varying, 'Dollar'::character varying, 'USD'::character varying])::text[]))),
    CONSTRAINT service_facility_duration_check CHECK (((duration)::text = ANY ((ARRAY['per hour'::character varying, 'per day'::character varying, 'per_day'::character varying, 'per_hour'::character varying])::text[]))),
    CONSTRAINT service_facility_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.service_facility OWNER TO postgres;

--
-- Name: service_facility_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_facility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_facility_id_seq OWNER TO postgres;

--
-- Name: service_facility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_facility_id_seq OWNED BY public.service_facility.id;


--
-- Name: service_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_feedback (
    feedback_id integer NOT NULL,
    request_id integer,
    rating integer,
    comment text,
    created_at date,
    status character varying(255)
);


ALTER TABLE public.service_feedback OWNER TO postgres;

--
-- Name: service_module; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_module (
    service_id integer NOT NULL,
    name character varying(255),
    description text,
    icon character varying(255),
    status character varying(255),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.service_module OWNER TO postgres;

--
-- Name: service_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_request (
    request_id integer NOT NULL,
    facility_id integer,
    user_id integer,
    org_name character varying(255),
    contact_person character varying(255),
    email character varying(255),
    phone_no character varying(255),
    event_type character varying(255),
    expected_atendee integer,
    special_request text,
    date date,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    to_be_paid numeric(10,2),
    status character varying(255)
);


ALTER TABLE public.service_request OWNER TO postgres;

--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_requests (
    id integer NOT NULL,
    org_name character varying(255) NOT NULL,
    contact_person character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone_no character varying(20) NOT NULL,
    exp_attendees integer NOT NULL,
    venue character varying(255) NOT NULL,
    category character varying(100),
    status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid boolean DEFAULT false,
    amount numeric DEFAULT 200,
    currency character varying(15) DEFAULT 'ETB'::character varying,
    file text,
    payment_window interval DEFAULT '2 days'::interval,
    approved_at timestamp without time zone,
    tx_ref character varying(80),
    payment_flag boolean DEFAULT true
);


ALTER TABLE public.service_requests OWNER TO postgres;

--
-- Name: service_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_requests_id_seq OWNER TO postgres;

--
-- Name: service_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_requests_id_seq OWNED BY public.service_requests.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: social_media_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_media_links (
    id integer NOT NULL,
    platform character varying(50) NOT NULL,
    url character varying(500) NOT NULL,
    icon_class character varying(100),
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.social_media_links OWNER TO postgres;

--
-- Name: social_media_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.social_media_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_media_links_id_seq OWNER TO postgres;

--
-- Name: social_media_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.social_media_links_id_seq OWNED BY public.social_media_links.id;


--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_questions (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    ordinal integer NOT NULL,
    type public.question_type NOT NULL,
    prompt text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.survey_questions OWNER TO postgres;

--
-- Name: survey_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_questions_id_seq OWNER TO postgres;

--
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.surveys (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    language character(2) DEFAULT 'en'::bpchar NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.surveys OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.surveys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.surveys_id_seq OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.surveys_id_seq OWNED BY public.surveys.id;


--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_types (
    ticket_id integer NOT NULL,
    event_id integer,
    type character varying(255),
    price numeric,
    description text,
    feature text,
    daily_limit integer,
    status character varying(255),
    step integer,
    is_deleted boolean DEFAULT false NOT NULL,
    last_reset_date date DEFAULT CURRENT_DATE,
    daily_limit_orig integer,
    currency character varying(3) DEFAULT 'ETB'::character varying,
    type_am character varying(255),
    description_am text,
    features_am text,
    CONSTRAINT ticket_types_currency_check CHECK (((currency)::text = ANY ((ARRAY['ETB'::character varying, 'USD'::character varying])::text[])))
);


ALTER TABLE public.ticket_types OWNER TO postgres;

--
-- Name: ticket_types_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ticket_types ALTER COLUMN ticket_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ticket_types_ticket_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unavailable_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unavailable_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unavailable_dates_id_seq OWNER TO postgres;

--
-- Name: unavailable_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unavailable_dates (
    id integer DEFAULT nextval('public.unavailable_dates_id_seq'::regclass) NOT NULL,
    venue_id integer NOT NULL,
    date date NOT NULL,
    weekly_recurrence integer,
    monthly_recurrence integer
);


ALTER TABLE public.unavailable_dates OWNER TO postgres;

--
-- Name: unavailable_time_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unavailable_time_slots (
    id integer NOT NULL,
    unavailable_date_id integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL
);


ALTER TABLE public.unavailable_time_slots OWNER TO postgres;

--
-- Name: unavailable_time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unavailable_time_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unavailable_time_slots_id_seq OWNER TO postgres;

--
-- Name: unavailable_time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unavailable_time_slots_id_seq OWNED BY public.unavailable_time_slots.id;


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer DEFAULT nextval('public.users_user_id_seq'::regclass) NOT NULL,
    fname character varying(255),
    lname character varying(255),
    email character varying(255),
    phone_no character varying(255),
    password text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gender character varying(255),
    username character varying(255),
    profile_image text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: venue_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venue_schedule (
    venue_id integer NOT NULL,
    venue character varying(255),
    status character varying(30),
    is_deleted boolean DEFAULT false NOT NULL,
    venue_am character varying(255)
);


ALTER TABLE public.venue_schedule OWNER TO postgres;

--
-- Name: venue_schedule_venue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.venue_schedule ALTER COLUMN venue_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.venue_schedule_venue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: visitor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visitor (
    user_id integer NOT NULL,
    nationality character varying(255),
    acc_type character varying(255),
    created timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.visitor OWNER TO postgres;

--
-- Name: advertisements ad_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertisements ALTER COLUMN ad_id SET DEFAULT nextval('public.advertisements_ad_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: department id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department ALTER COLUMN id SET DEFAULT nextval('public.department_id_seq'::regclass);


--
-- Name: email_verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications ALTER COLUMN id SET DEFAULT nextval('public.email_verifications_id_seq'::regclass);


--
-- Name: event_category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_category ALTER COLUMN id SET DEFAULT nextval('public.event_category_id_seq'::regclass);


--
-- Name: feedback_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_responses ALTER COLUMN id SET DEFAULT nextval('public.feedback_responses_id_seq'::regclass);


--
-- Name: group_discounts discount_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_discounts ALTER COLUMN discount_id SET DEFAULT nextval('public.group_discounts_discount_id_seq'::regclass);


--
-- Name: image_galleries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_galleries ALTER COLUMN id SET DEFAULT nextval('public.image_galleries_id_seq'::regclass);


--
-- Name: journey_timeline id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_timeline ALTER COLUMN id SET DEFAULT nextval('public.journey_timeline_id_seq'::regclass);


--
-- Name: mission_vision_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission_vision_values ALTER COLUMN id SET DEFAULT nextval('public.mission_vision_values_id_seq'::regclass);


--
-- Name: museum_info id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.museum_info ALTER COLUMN id SET DEFAULT nextval('public.museum_info_id_seq'::regclass);


--
-- Name: page_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_content ALTER COLUMN id SET DEFAULT nextval('public.page_content_id_seq'::regclass);


--
-- Name: partners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners ALTER COLUMN id SET DEFAULT nextval('public.partners_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: pending_table_service id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_table_service ALTER COLUMN id SET DEFAULT nextval('public.pending_table_service_id_seq'::regclass);


--
-- Name: question_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options ALTER COLUMN id SET DEFAULT nextval('public.question_options_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: request_dates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_dates ALTER COLUMN id SET DEFAULT nextval('public.request_dates_id_seq'::regclass);


--
-- Name: request_timeslot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_timeslot ALTER COLUMN id SET DEFAULT nextval('public.request_timeslot_id_seq'::regclass);


--
-- Name: response_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_answers ALTER COLUMN id SET DEFAULT nextval('public.response_answers_id_seq'::regclass);


--
-- Name: service_category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_category ALTER COLUMN id SET DEFAULT nextval('public.service_category_id_seq'::regclass);


--
-- Name: service_facility id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_facility ALTER COLUMN id SET DEFAULT nextval('public.service_facility_id_seq'::regclass);


--
-- Name: service_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN id SET DEFAULT nextval('public.service_requests_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: social_media_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_media_links ALTER COLUMN id SET DEFAULT nextval('public.social_media_links_id_seq'::regclass);


--
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- Name: surveys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys ALTER COLUMN id SET DEFAULT nextval('public.surveys_id_seq'::regclass);


--
-- Name: unavailable_time_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_time_slots ALTER COLUMN id SET DEFAULT nextval('public.unavailable_time_slots_id_seq'::regclass);


--
-- Data for Name: advertisement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advertisement (ad_id, ad_title, ad_description) FROM stdin;
1	Summer Discount!	Get 20% off on all bookings this summer.
2	VIP Packages	Upgrade to VIP and enjoy premium benefits.
\.


--
-- Data for Name: advertisements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advertisements (ad_id, title, title_am, image_url, link_url, "position", is_active, description, description_am, start_date, end_date, category, discount, animation, created_at) FROM stdin;
4	Battle of Adwa 	new 	http://localhost:8080/uploads/ads/1756843781228-warriors.jpeg	https://chatgpt.com/c/68b1c747-dd80-8330-94b6-9364c3573bbf	banner	t	fsdf	dfg	2025-08-26	2025-09-13	education	30%	{"type": "fade", "images": ["http://localhost:8080/uploads/ads/1756763004507-adwa-museum-aerial.png"], "duration": 3500}	2025-09-02 00:43:26.825084
1	Exibition	name	http://localhost:8080/uploads/ads/1756762521664-abrehot.webp	https://chatgpt.com/c/68b1c747-dd80-8330-94b6-9364c3573bbf	banner	t	Advertisiment	ads	2025-08-30	2025-09-24	exhibition	50%	{"type": "fade", "images": ["http://localhost:8080/uploads/ads/1756762613213-adwa-museum-interior.jpeg"], "duration": 3500}	2025-09-02 00:37:05.475973
2	New	new	http://localhost:8080/uploads/ads/1756762787962-battle.jpg		footer	t	new new	\N	2025-08-31	2025-09-24	exhibition	20%	{"type": "fade", "images": ["http://localhost:8080/uploads/ads/1756762828174-adwa-warriors-day.jpeg"], "duration": 3500}	2025-09-02 00:40:30.419023
8	qwe	የ አድዋ ድል መታሰብያ	http://localhost:8080/uploads/ads/1756891506780-digital.jpg		banner	t	\N	\N	2025-08-30	2025-09-15	exhibition	20%	{"type": "fade", "images": ["http://localhost:8080/uploads/ads/1756891520186-adwa-museum-aerial.png"], "duration": 3500}	2025-09-03 12:25:48.578408
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, module, target_id, old_value, new_value, created_at) FROM stdin;
1	1	CREATE_USER	Users	3	\N	{"email": "carol@example.com", "fname": "Carol", "lname": "White"}	2025-07-23 15:22:40.333764
2	2	CREATE_EVENT	Events	1	\N	{"title": "Tech Conference", "location": "Main Hall"}	2025-07-23 15:22:40.333764
3	1	CREATE_USER	Users	10	\N	{"email": "alice@example.com", "fname": "Alice", "lname": "Smith"}	2025-07-21 17:17:13.192926
4	2	UPDATE_ROLE	Roles	3	{"name": "Editor"}	{"name": "Senior Editor"}	2025-07-22 17:17:13.192926
5	3	DELETE_PERMISSION	Permissions	5	{"permission": "can_delete_posts"}	\N	2025-07-22 21:17:13.192926
6	1	UPDATE_USER	Users	10	{"email": "alice@example.com"}	{"email": "alice.smith@example.com"}	2025-07-23 05:17:13.192926
7	2	CREATE_TICKET	Tickets	21	\N	{"status": "Open", "subject": "Login issue"}	2025-07-23 11:17:13.192926
\.


--
-- Data for Name: booking_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_groups (group_id, group_name, group_leader_email, total_members, created_at) FROM stdin;
3318bba9-1320-4f51-8c24-320273c9e980	leee	luhenaabebe086@gmail.com	11	2025-09-07 15:16:58.017725
ba344a00-4888-4190-bea7-3dabe7c48f5e	Luhena	luhenaabebe086@gmail.com	12	2025-09-07 15:58:28.817317
f184c344-8624-48f2-83d3-1e3ba703dd61	Luhena	luhenaabebe086@gmail.com	5	2025-09-15 20:23:29.288753
afc45dc5-ae54-462f-b15a-9d701c636310	Luhena	luhenaabebe086@gmail.com	5	2025-09-15 22:01:54.801089
\.


--
-- Data for Name: bought_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bought_services (id, ticket_booking_id, service_id, quantity) FROM stdin;
\.


--
-- Data for Name: bought_ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bought_ticket (ticket_booking_id, visit_date, email, paid_amount, total_tickets, walkin, group_id, chapa_tx_ref, status, is_logged, bought_date, discount_breakdown) FROM stdin;
6efcbad1-24b8-4cca-b026-fae29a108703	2025-08-07	mahiderjemere12@gmail.com	100.00	1	no	\N	320c7949-60f8-415e-b00f-a2b886fc702d	paid	f	2025-08-30	\N
dfb3925d-5f13-42f5-b2e5-16218da0c04c	2025-08-09	mahiderjemere12@gmail.com	6912.00	21	no	\N	f7478a31-8872-4613-9a08-9a27c5c9ce7b	paid	f	2025-08-30	\N
aa55624f-212c-4d67-a012-3ba5777ba272	2025-08-07	mahiderjemere12@gmail.com	2304.00	7	no	\N	38ca6b57-b68e-4233-9de3-a92d53fb233f	paid	f	2025-08-30	\N
tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	2025-08-06	adwa@adwavictory.com	4608.00	14	yes	\N	\N	\N	f	2025-08-30	\N
fbbc0c22-e824-47fd-9c6e-3a4b4556514d	2025-08-07	mahiderjemere12@gmail.com	2304.00	7	no	\N	c8dfb95d-18ea-4c22-a1c1-90b239347e0a	paid	f	2025-08-30	\N
b858ef6a-0515-45c3-b11b-75aa859e2e86	2025-08-15	mahiderjemere12@gmail.com	600.00	2	no	\N	b1561355-8fe7-4011-a75e-d02821328dd8	paid	f	2025-08-30	\N
tx-adwamuseum-b84bd936-18dc-4962-906c-ba6073b43625	2025-08-06	adwa@adwavictory.com	600.00	2	yes	\N	\N	\N	f	2025-08-30	\N
a63d6fc1-d403-4582-b0e4-fd4130216b94	2025-08-12	mahiderjemere12@gmail.com	2204.00	7	no	\N	ef33604a-b4da-4432-a325-35d0ff58ed70	paid	f	2025-08-30	\N
tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	2025-08-12	adwa@adwavictory.com	2204.00	7	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-f574cef8-40ef-4be1-9fba-a5627eba7d03	2025-08-13	adwa@adwavictory.com	1500.00	3	yes	\N	\N	\N	f	2025-08-30	\N
03303d11-c6e1-48bd-91f1-7b6e5e270cd3	2025-08-13	Lytsman56@gmail.com	2204.00	7	no	\N	e08724b0-ac68-40a5-b31c-e1b193f1c781	paid	f	2025-08-30	\N
tx-adwamuseum-1fec367e-bd13-4a8a-be9b-d6735a69da16	2025-08-14	adwa@adwavictory.com	1000.00	2	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-2c2a82c6-037d-426a-b288-8f869249145a	2025-08-14	adwa@adwavictory.com	500.00	1	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-7993648f-7379-43d0-8e1c-c3100c6d1972	2025-08-14	adwa@adwavictory.com	200.00	1	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-2493278d-154b-485c-b027-29dc5045cfcb	2025-08-14	adwa@adwavictory.com	500.00	1	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-629444ac-f5f1-4439-9c95-546b6e36180e	2025-08-15	adwa@adwavictory.com	200.00	1	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	2025-08-19	adwa@adwavictory.com	1800.00	6	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-35ea0e61-602a-47c0-83ca-23c9a8fd46f2	2025-08-19	adwa@adwavictory.com	1304.00	4	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-e04969a1-c996-4202-a7c2-b9e391d55504	2025-08-19	adwa@adwavictory.com	1400.00	4	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-1ed30062-725a-4512-b789-bb413e53efa7	2025-08-19	adwa@adwavictory.com	600.00	3	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-e482466b-6124-47b5-92c2-d74c663ff829	2025-08-19	adwa@adwavictory.com	16.00	4	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-fcbc50d6-53be-475d-b76f-fc7fab865684	2025-08-19	adwa@adwavictory.com	1800.00	3	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-1c2a7416-c715-4e59-a405-fc940a9d6f86	2025-08-19	adwa@adwavictory.com	1000.00	2	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-a291c535-ae46-4be1-b43d-d36ad9cc56b3	2025-08-19	adwa@adwavictory.com	1500.00	3	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-a2fde565-0855-40c7-bdc0-dd725429332a	2025-08-19	adwa@adwavictory.com	900.00	3	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	2025-08-19	adwa@adwavictory.com	1800.00	6	yes	\N	\N	\N	f	2025-08-30	\N
tx-adwamuseum-558a11ac-2cfd-4a0f-b5f3-e17d9022c5a7	2025-08-20	adwa@adwavictory.com	1000.00	2	yes	\N	\N	\N	t	2025-08-30	\N
b2f77f9c-ff7b-4254-8272-d7825b0620c2	2025-08-21	luhenaabebe086@gmail.com	500.00	1	no	\N	34086186-97ad-49ea-bf60-2270d5ef2d07	paid	f	2025-08-30	\N
tx-adwamuseum-e83eadad-d57e-4274-b170-0f8a2f82f0b1	2025-08-21	adwa@adwavictory.com	500.00	1	yes	\N	\N	\N	t	2025-08-30	\N
228a48ba-dbc9-43dd-b4c3-680bd17f8e37	2025-08-27	luhenaabebe086@gmail.com	600.00	2	no	\N	ebf050fc-d3db-4b99-954e-76e96ba646a2	paid	f	2025-08-30	\N
tx-adwamuseum-258813c7-c108-413b-bd00-922484f0d017	2025-08-25	adwa@adwavictory.com	900.00	3	yes	\N	\N	\N	t	2025-08-30	\N
tx-adwamuseum-0ef8e562-080f-4921-b0f0-1daa627a458e	2025-08-25	adwa@adwavictory.com	1000.00	2	yes	\N	\N	\N	t	2025-08-30	\N
4e42475c-6e8e-40ef-97e9-04680e15f898	2025-09-18	luhenaabebe086@gmail.com	2204.00	7	no	\N	d7ff9ff8-df54-4de6-93fb-1d84889c0181	paid	f	2025-09-01	\N
89b8ec47-fd73-4e76-a36d-11639e4e7b95	2025-09-11	luhenaabebe086@gmail.com	2204.00	7	no	\N	30602285-26b0-48d9-aea5-4342f7295b7f	paid	f	2025-09-01	\N
4e722916-1ec8-4756-aed0-196f4f4422f7	2025-09-18	luhenaabebe@gmail.com	2204.00	7	no	\N	c9ccc539-fce8-42bc-928d-df46272684ad	paid	f	2025-09-01	\N
tx-adwamuseum-bbc7f09a-693d-40e5-8cc0-cec316bdacb9	2025-09-02	adwa@adwavictory.com	4.00	1	yes	\N	\N	\N	t	2025-09-02	\N
tx-adwamuseum-14fe53b7-de7f-4afc-ab4b-b95c879dac05	2025-09-02	adwa@adwavictory.com	42546.53	1	yes	\N	\N	\N	t	2025-09-02	\N
052eb166-153f-436c-a2e7-224ba3028120	2025-09-24	mahderyizengaw69@gmail.com	1000.00	2	no	\N	1e4adf01-bf28-4338-871d-3b78e3928589	paid	f	2025-09-03	\N
90b4919f-30bc-427d-9637-ae4bf36873d8	2025-09-18	luhenaabebe086@gmail.com	600.00	2	no	\N	0029d98b-6274-47a6-9d88-f74ea7993728	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 1, "ticket_id": 3, "base_line_total": 500, "base_unit_price": 500, "final_line_total": 500, "line_discount_amount": 0, "discounted_unit_price": "500", "discount_percent_applied": 0}, {"currency": "ETB", "quantity": 1, "ticket_id": 4, "base_line_total": 100, "base_unit_price": 100, "final_line_total": 100, "line_discount_amount": 0, "discounted_unit_price": "100", "discount_percent_applied": 0}]
433f0907-7971-4a7b-947d-598b1cface83	2025-09-25	luhenaabebe086@gmail.com	1500.00	11	no	3318bba9-1320-4f51-8c24-320273c9e980	21bc42ea-a23c-427a-8663-4c2185c55cf9	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 10, "ticket_id": 4, "base_line_total": 1000, "base_unit_price": 100, "final_line_total": 900, "line_discount_amount": 100, "discounted_unit_price": 90, "discount_percent_applied": 10}, {"currency": "ETB", "quantity": 1, "ticket_id": 6, "base_line_total": 600, "base_unit_price": 600, "final_line_total": 600, "line_discount_amount": 0, "discounted_unit_price": "600", "discount_percent_applied": 0}]
7206899f-ffb0-448c-9ecc-f22706373577	2025-09-24	luhenaabebe086@gmail.com	1204.00	12	no	ba344a00-4888-4190-bea7-3dabe7c48f5e	bb2c143a-9ac1-4e4d-8ca4-47c32cda0d4f	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 10, "ticket_id": 4, "base_line_total": 1000, "base_unit_price": 100, "final_line_total": 900, "line_discount_amount": 100, "discounted_unit_price": 90, "discount_percent_applied": 10}, {"currency": "ETB", "quantity": 1, "ticket_id": 5, "base_line_total": 300, "base_unit_price": 300, "final_line_total": 300, "line_discount_amount": 0, "discounted_unit_price": "300", "discount_percent_applied": 0}, {"currency": "ETB", "quantity": 1, "ticket_id": 8, "base_line_total": 4, "base_unit_price": 4, "final_line_total": 4, "line_discount_amount": 0, "discounted_unit_price": "4", "discount_percent_applied": 0}]
e28a9840-5975-446c-9561-d5c45a6d0e05	2025-09-25	fsdfsdf@sdfdsf.com	600.00	2	no	\N	8cfb3248-cb90-4b2c-a753-6c20449edb90	paid	f	2025-09-07	[{"currency": "USD", "quantity": 2, "ticket_id": 13, "base_line_total": 600, "base_unit_price": 300, "final_line_total": 600, "line_discount_amount": 0, "discounted_unit_price": "300", "discount_percent_applied": 0}]
87699b1c-25dd-42b6-bbb2-685ea5b45f38	2025-09-25	abebetamrat21@gmail.com	500.00	1	no	\N	738c9a2e-69a4-487c-8586-04d6f847b1d9	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 1, "ticket_id": 2, "base_line_total": 500, "base_unit_price": 500, "final_line_total": 500, "line_discount_amount": 0, "discounted_unit_price": "500.00", "discount_percent_applied": 0}]
71a0dc6b-bd78-4fda-85a2-6c3e74ac3da4	2025-09-25	abebetamrat21@gmail.com	500.00	1	no	\N	da28f6fc-30bc-4a0a-b89b-47e66455536e	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 1, "ticket_id": 3, "base_line_total": 500, "base_unit_price": 500, "final_line_total": 500, "line_discount_amount": 0, "discounted_unit_price": "500", "discount_percent_applied": 0}]
2c5cfbf4-e914-44b0-8b8e-12b78d73ec08	2025-09-25	abebetamrat21@gmail.com	600.00	1	no	\N	5a53984f-02f1-4a16-9b47-57a818535629	paid	f	2025-09-07	[{"currency": "ETB", "quantity": 1, "ticket_id": 6, "base_line_total": 600, "base_unit_price": 600, "final_line_total": 600, "line_discount_amount": 0, "discounted_unit_price": "600", "discount_percent_applied": 0}]
efb5ffd6-6576-44e9-a4f1-e82b1cc54f51	2025-09-24	abebetamrat21@gmail.com	400.00	2	no	\N	c0956d1a-6654-4883-b377-4c1743e49125	paid	f	2025-09-08	[{"currency": "ETB", "quantity": 1, "ticket_id": 4, "base_line_total": 100, "base_unit_price": 100, "final_line_total": 100, "line_discount_amount": 0, "discounted_unit_price": "100", "discount_percent_applied": 0}, {"currency": "ETB", "quantity": 1, "ticket_id": 5, "base_line_total": 300, "base_unit_price": 300, "final_line_total": 300, "line_discount_amount": 0, "discounted_unit_price": "300", "discount_percent_applied": 0}]
3b3fd39d-4063-41de-86e8-ef39fbfaef93	2025-09-12	abebetamrat21@gmail.com	300.00	1	no	\N	8a06cd30-1b15-4fec-b0b7-e4b00e0afeef	paid	f	2025-09-09	[{"currency": "USD", "quantity": 1, "ticket_id": 13, "base_line_total": 300, "base_unit_price": 300, "final_line_total": 300, "line_discount_amount": 0, "discounted_unit_price": "300", "discount_percent_applied": 0}]
tx-adwamuseum-0d709d74-fbe7-45d6-a6b2-04d70e5b957e	2025-09-12	adwa@adwavictory.com	300.00	1	yes	\N	\N	\N	t	2025-09-12	\N
03d759ea-859c-44a1-8f07-360e294d1b74	2025-09-25	abebetamrat21@gmail.com	1000.00	2	no	\N	9f840180-7204-4560-9314-1c28389f393b	paid	f	2025-09-12	[{"currency": "ETB", "quantity": 2, "ticket_id": 2, "base_line_total": 1000, "base_unit_price": 500, "final_line_total": 1000, "line_discount_amount": 0, "discounted_unit_price": "500", "discount_percent_applied": 0}]
9a1fa49b-6d84-4a54-80bc-b025de7fd873	2025-09-25	luhenaabebe086@gmail.com	500.00	1	no	\N	ed45bff2-dd4b-4a74-ab5d-3c50d96330de	paid	f	2025-09-12	[{"currency": "ETB", "quantity": 1, "ticket_id": 3, "base_line_total": 500, "base_unit_price": 500, "final_line_total": 500, "line_discount_amount": 0, "discounted_unit_price": "500", "discount_percent_applied": 0}]
0f75c467-b375-4a9d-aad8-823998bda949	2025-09-17	luhenaabebe086@gmail.com	2850.00	5	no	f184c344-8624-48f2-83d3-1e3ba703dd61	069ac441-2d96-457a-af93-82c985dff149	paid	f	2025-09-15	[{"currency": "ETB", "quantity": 5, "ticket_id": 6, "base_line_total": 3000, "base_unit_price": 600, "final_line_total": 2850, "line_discount_amount": 150, "discounted_unit_price": 570, "discount_percent_applied": 5}]
tx-adwamuseum-139a5ed6-5f61-4f3a-845e-7317ac970b71	2025-09-15	adwa@adwavictory.com	200.00	2	yes	\N	\N	\N	t	2025-09-15	\N
abc0a821-c4e1-4478-bbed-b84c89d9a1f5	2025-09-18	luhenaabebe086@gmail.com	300.00	3	no	\N	0e41613f-c342-48b0-a2a9-77b6af396c77	paid	f	2025-09-15	[{"currency": "ETB", "quantity": 3, "ticket_id": 4, "base_line_total": 300, "base_unit_price": 100, "final_line_total": 300, "line_discount_amount": 0, "discounted_unit_price": "100", "discount_percent_applied": 0}]
93988720-7924-4de6-b3fd-c25861146561	2025-09-19	luhenaabebe086@gmail.com	200.00	2	no	\N	0fcd3174-4137-4bb5-a3fd-a1d34f05d3d7	paid	f	2025-09-15	[{"currency": "ETB", "quantity": 2, "ticket_id": 4, "base_line_total": 200, "base_unit_price": 100, "final_line_total": 200, "line_discount_amount": 0, "discounted_unit_price": "100", "discount_percent_applied": 0}]
99342703-621e-4dee-8140-b4b7590a0aab	2025-09-24	luhenaabebe086@gmail.com	2425.00	5	no	afc45dc5-ae54-462f-b15a-9d701c636310	6c682033-db3c-4195-aa1d-24bce3c82832	paid	f	2025-09-15	[{"currency": "ETB", "quantity": 5, "ticket_id": 3, "base_line_total": 2500, "base_unit_price": 500, "final_line_total": 2425, "line_discount_amount": 75, "discounted_unit_price": 485, "discount_percent_applied": 3}]
tx-adwamuseum-42e1840e-7fa7-474a-a7be-368d48136125	2025-09-16	adwa@adwavictory.com	1000.00	2	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-8aa6903e-d59f-464e-9a36-5daf6aa4d987	2025-09-16	adwa@adwavictory.com	500.00	1	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-c63d15cf-3ed3-4e17-a9dc-14b0de6645cb	2025-09-16	adwa@adwavictory.com	86336.94	2	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-1af8a75c-d626-47cc-a17f-e8ff9884750b	2025-09-16	adwa@adwavictory.com	43671.09	2	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-8c8e1964-94e9-4974-9baf-7a3b91c9e8db	2025-09-16	adwa@adwavictory.com	43170.23	1	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-c52b2c30-33ae-4d9f-ae27-66ca46c87bc6	2025-09-16	adwa@adwavictory.com	86340.78	2	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	2025-09-16	adwa@adwavictory.com	1300.00	13	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-4cf7271c-8016-485c-b701-927695bce9e9	2025-09-15	adwa@adwavictory.com	200.00	2	yes	\N	\N	\N	t	2025-09-15	\N
tx-adwamuseum-921f10e9-a42c-4d63-9e9b-4887dd89d789	2025-09-15	adwa@adwavictory.com	300.00	1	yes	\N	\N	\N	t	2025-09-15	\N
\.


--
-- Data for Name: bought_ticket_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bought_ticket_types (type_id, ticket_booking_id, event_booking_id, status, ticket_id, unit_price, discount_percent) FROM stdin;
abd5501a-ebff-4c29-bbac-0d9276548908	90b4919f-30bc-427d-9637-ae4bf36873d8	\N	invalid	3	500.00	0.00
7b37c391-0f91-408d-b1e1-a8e363887354	90b4919f-30bc-427d-9637-ae4bf36873d8	\N	invalid	4	100.00	0.00
7c951a20-7f5c-4bc5-b487-33a239c806ac	e28a9840-5975-446c-9561-d5c45a6d0e05	\N	valid	13	300.00	0.00
5b489c90-e2dc-4e9a-89ad-f97b6d4b5050	e28a9840-5975-446c-9561-d5c45a6d0e05	\N	valid	13	300.00	0.00
b4866b9b-9837-4ead-9ddf-46391049ec7c	2c5cfbf4-e914-44b0-8b8e-12b78d73ec08	\N	valid	6	600.00	0.00
T-5PIG4	tx-adwamuseum-0d709d74-fbe7-45d6-a6b2-04d70e5b957e	\N	invalid	5	\N	0.00
0a0b8e13-9633-41e4-8d9a-c0b22da8c32d	abc0a821-c4e1-4478-bbed-b84c89d9a1f5	\N	valid	4	100.00	0.00
3744f450-d45c-4681-8ad2-d8a12de92f95	abc0a821-c4e1-4478-bbed-b84c89d9a1f5	\N	valid	4	100.00	0.00
bbe6a69d-d48a-4d6a-98cf-cfa88fa1e687	abc0a821-c4e1-4478-bbed-b84c89d9a1f5	\N	valid	4	100.00	0.00
T-5P4I7	tx-adwamuseum-42e1840e-7fa7-474a-a7be-368d48136125	\N	invalid	2	\N	0.00
T-KI9VD	tx-adwamuseum-42e1840e-7fa7-474a-a7be-368d48136125	\N	invalid	2	\N	0.00
T-PD9MY	tx-adwamuseum-1af8a75c-d626-47cc-a17f-e8ff9884750b	\N	invalid	2	\N	0.00
T-FGV8Y	tx-adwamuseum-1af8a75c-d626-47cc-a17f-e8ff9884750b	\N	invalid	5	\N	0.00
T-VDXV2	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-767KN	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-J8A9M	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-BW9E6	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-M7AKE	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-XTTIY	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-T6DOA	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-REAZB	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-L0ANF	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-X5GIN	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-YKY1H	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-8VII2	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-6XTYD	tx-adwamuseum-a5e4398b-8078-4aff-a7e8-6f2ff5df7d38	\N	invalid	4	\N	0.00
T-WTGDV	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	1	300.00	0.00
e9219a90-1e80-4cd1-b842-316abd717027	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
4fab8588-d6e3-478b-ba1f-52da88e523fa	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
11b2d857-8c39-47d2-88ce-620ab374b097	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
459edd1e-bb78-40d9-b053-b84923260c61	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
0aa7414b-9449-4fd1-a227-562526f931c2	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
35a0654d-3cdf-4e80-a20f-82abdf7dc4ed	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
65378778-dc92-4f63-a85a-d3f554ca08f1	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
1ce64df7-c0c9-4e80-80de-c7863cf6100d	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
f4c80dd5-7e9e-4d2b-8da9-c49737c8bdd1	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	4	90.00	10.00
b5355b0a-3a4d-42df-bea6-7b863e71fdf1	433f0907-7971-4a7b-947d-598b1cface83	\N	valid	6	600.00	0.00
bc562dbb-cff2-4bc1-bd41-82c521561735	433f0907-7971-4a7b-947d-598b1cface83	\N	invalid	4	90.00	10.00
5e5a2503-9054-4545-8c1e-9ee5c729b904	87699b1c-25dd-42b6-bbb2-685ea5b45f38	\N	invalid	2	500.00	0.00
94d1d5c1-cebb-4c34-bf54-9c438bcd428f	efb5ffd6-6576-44e9-a4f1-e82b1cc54f51	\N	valid	4	100.00	0.00
d1472c39-e704-40c8-83cb-b079b5faadc6	efb5ffd6-6576-44e9-a4f1-e82b1cc54f51	\N	valid	5	300.00	0.00
98705fab-d025-4638-831b-bfce1f670bdd	03d759ea-859c-44a1-8f07-360e294d1b74	\N	valid	2	500.00	0.00
1ec89b00-4cdd-4f57-86c7-6bd82862ca54	03d759ea-859c-44a1-8f07-360e294d1b74	\N	valid	2	500.00	0.00
f637f133-b15f-462d-b762-348d3cba21b0	0f75c467-b375-4a9d-aad8-823998bda949	\N	valid	6	570.00	5.00
955a1659-6047-490f-8a1e-1a58db7d0d44	0f75c467-b375-4a9d-aad8-823998bda949	\N	valid	6	570.00	5.00
02953c50-3b8a-4497-b559-09d828698316	0f75c467-b375-4a9d-aad8-823998bda949	\N	valid	6	570.00	5.00
98681694-d0a1-4f6c-9684-5de3bcefe6a2	0f75c467-b375-4a9d-aad8-823998bda949	\N	valid	6	570.00	5.00
8c0f730f-bd49-4bca-afc5-b34db382c89f	0f75c467-b375-4a9d-aad8-823998bda949	\N	invalid	6	570.00	5.00
f27d7600-25e1-4640-9439-86e12071e69e	93988720-7924-4de6-b3fd-c25861146561	\N	valid	4	100.00	0.00
08d3b245-94cb-4a72-b1b2-327cea086c8d	93988720-7924-4de6-b3fd-c25861146561	\N	valid	4	100.00	0.00
T-VDY5C	tx-adwamuseum-8aa6903e-d59f-464e-9a36-5daf6aa4d987	\N	invalid	2	\N	0.00
T-O4RF6	tx-adwamuseum-8c8e1964-94e9-4974-9baf-7a3b91c9e8db	\N	invalid	5	\N	0.00
T-P8IAQ	tx-adwamuseum-4cf7271c-8016-485c-b701-927695bce9e9	\N	invalid	4	\N	0.00
T-6SO38	tx-adwamuseum-4cf7271c-8016-485c-b701-927695bce9e9	\N	invalid	4	\N	0.00
5c4eac48-8d6d-44be-ab79-1315bdc12104	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	5	300.00	0.00
476f8328-29d1-4fb0-8cae-ce1e4bc7cd0e	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
97c715c5-01a5-436f-8b30-8da874126661	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
ed912bf1-909f-4075-b30c-2e9ea08373f7	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
1bcf92f5-7ec5-4f95-af55-29540fbc5f8b	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
fb236146-453c-49e9-ae31-8427e743e4d5	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
551087f1-3451-4522-8b4c-2db6ca6e9c77	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
fd1cb39f-ae91-4c15-a450-be9f45813209	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
1f3a7c63-af0e-4b34-9e2a-67625dc5fe39	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
b5850751-7f0c-42e1-9564-ec25a6cfcc4c	6efcbad1-24b8-4cca-b026-fae29a108703	\N	valid	4	100.00	0.00
edc5e4bf-3911-46b9-bfca-eb17fe7b81e7	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	1	300.00	0.00
e49cd79c-9519-4d6d-832c-0440df2f99ed	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	1	300.00	0.00
772c2b61-1b01-468c-a2c7-8ceabc88cb8f	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	1	300.00	0.00
07dd8872-9e86-49ec-8956-ec305fc8812c	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	2	500.00	0.00
42251e3c-7a77-49e3-bb1b-758bd79be89a	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	2	500.00	0.00
ebf26143-d8e4-4556-970c-1ac8e297b1a7	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	2	500.00	0.00
8f6e59b8-4bc5-477e-bcb5-15708f681273	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	3	500.00	0.00
39f38574-64a1-4daf-90f5-23d282f5015e	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	3	500.00	0.00
6894b814-0fb7-4e54-b3a0-36c4e21c74e6	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	4	100.00	0.00
85eedc67-e685-4c1a-af85-677e53f76aad	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	4	100.00	0.00
f670de21-37d3-4356-8b18-51bc246075af	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	4	100.00	0.00
0bf3e58c-dd89-4a99-b9d9-8d86ce89d429	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	5	300.00	0.00
045f7b1d-d94f-4356-a974-b82a01c708a3	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	5	300.00	0.00
69088557-add2-40c0-aef2-c4305e92827e	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	5	300.00	0.00
8d2021ed-c97c-4b9a-9cb0-f9bb1e00be4a	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	6	600.00	0.00
7cb66907-a572-47e3-ab3f-1ba6ad6e4fee	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	6	600.00	0.00
5ca125b8-0f7b-49ed-8ee6-df2bd65c9cc6	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	6	600.00	0.00
ca607044-6fe6-49d8-9185-268414d1782e	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	8	4.00	0.00
211684b2-7858-4250-ba01-679ab36e0bfe	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	8	4.00	0.00
c076ea0b-13b4-401a-b804-5d629e7208a5	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	valid	8	4.00	0.00
2f309315-3084-4d46-9afe-6b082a991e49	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	1	300.00	0.00
7b3025e9-282b-4fa9-a01b-ed7c6d2c0d8f	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	2	500.00	0.00
506123e8-fc39-4ecf-927b-b18937e00445	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	3	500.00	0.00
eac5b2a5-0aa4-4192-a0d0-834a53f77a3e	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	4	100.00	0.00
6ac98497-18ec-4100-b651-e8d16b845cbb	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	5	300.00	0.00
c1bb5e53-bdd1-4198-b82c-429925c1eb7c	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	6	600.00	0.00
2c509213-3933-42dd-bbc3-3974627fb839	aa55624f-212c-4d67-a012-3ba5777ba272	\N	valid	8	4.00	0.00
T-44XI7	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	1	300.00	0.00
T-59ROY	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	3	500.00	0.00
T-GGDS5	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	3	500.00	0.00
T-MOBFM	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	4	100.00	0.00
T-N9DLP	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	4	100.00	0.00
T-HWFV3	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	5	300.00	0.00
T-HPJ7M	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	5	300.00	0.00
T-JQPYZ	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	6	600.00	0.00
T-KQ02Q	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	6	600.00	0.00
T-UDDH6	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	8	4.00	0.00
T-COFK7	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	8	4.00	0.00
T-5UHKL	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	2	500.00	0.00
T-Y5HQA	tx-adwamuseum-e4828828-1ef1-4402-a2e9-52b8f44a4118	\N	invalid	2	500.00	0.00
df50be1e-f40f-4edb-83bb-df3175cb8cf3	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	1	300.00	0.00
3110e114-4651-4d2a-b47e-b2bb61bf5756	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	2	500.00	0.00
e2645f0d-3a62-4c5c-9668-6b47fe3d0a0e	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	3	500.00	0.00
d9223b30-107d-4cb3-a733-1fc406e4d524	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	4	100.00	0.00
ade4b40a-6b4b-48da-9dd3-8414a69b29e0	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	5	300.00	0.00
03703b7b-bd19-4595-b166-e5b99576c774	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	6	600.00	0.00
a8fad1b5-9513-40be-8075-a20a69b3b841	fbbc0c22-e824-47fd-9c6e-3a4b4556514d	\N	valid	8	4.00	0.00
969e370c-6396-48df-a856-143a751ccc6c	b858ef6a-0515-45c3-b11b-75aa859e2e86	\N	valid	4	100.00	0.00
T-U00DC	tx-adwamuseum-b84bd936-18dc-4962-906c-ba6073b43625	\N	invalid	1	300.00	0.00
T-LVSCT	tx-adwamuseum-b84bd936-18dc-4962-906c-ba6073b43625	\N	invalid	1	300.00	0.00
e2fa99e4-fefa-49d6-b695-6f1c6a46ce07	b858ef6a-0515-45c3-b11b-75aa859e2e86	\N	invalid	3	500.00	0.00
92057aaa-85e4-4fe1-ad3f-7ffcd2f8cae0	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	2	500.00	0.00
979dfae6-2e1f-4330-bc6d-9bc3b7cc1198	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	3	500.00	0.00
48aaf56c-4bfb-44b8-aa9e-aee0641fd2e1	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	4	100.00	0.00
a10b535c-ad0d-42d7-923c-0d2b43390c0f	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	5	300.00	0.00
e6b24ba6-dda7-4862-8c68-5683707d2e20	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	6	600.00	0.00
c67091ce-4f52-4b64-bd1a-267254c8e6f7	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	8	4.00	0.00
2ec80e05-fc96-4203-bb08-a8c5336e99f9	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	valid	6	600.00	0.00
afd5486b-cc42-4fa5-bed6-f93184955b7c	a63d6fc1-d403-4582-b0e4-fd4130216b94	\N	valid	13	300.00	0.00
T-1XKWT	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	3	500.00	0.00
T-AANPC	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	4	100.00	0.00
T-X5KC7	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	5	300.00	0.00
T-4124D	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	6	600.00	0.00
T-7SNX0	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	8	4.00	0.00
T-AUWMV	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	2	500.00	0.00
T-51UJA	tx-adwamuseum-b24992a2-e1fa-4d3b-9479-2c1a4525ff71	\N	invalid	13	300.00	0.00
T-ZLREM	tx-adwamuseum-f574cef8-40ef-4be1-9fba-a5627eba7d03	\N	invalid	3	500.00	0.00
T-9LTG5	tx-adwamuseum-f574cef8-40ef-4be1-9fba-a5627eba7d03	\N	invalid	3	500.00	0.00
T-X0YL0	tx-adwamuseum-f574cef8-40ef-4be1-9fba-a5627eba7d03	\N	invalid	3	500.00	0.00
0a938620-1d99-48fb-9a3a-c54d15924556	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	2	500.00	0.00
92d69248-789f-4529-9ddf-74f8a44cf6a5	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	3	500.00	0.00
c5c11e88-22ea-4f45-8862-8f6f90ecd52d	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	4	100.00	0.00
cfc8ef6c-fbba-45c3-a7a9-01d1d66487f1	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	6	600.00	0.00
ce559341-a243-4083-8f30-fa12bbc02298	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	8	4.00	0.00
724798b7-ca64-4461-aac1-2248266e1784	03303d11-c6e1-48bd-91f1-7b6e5e270cd3	\N	valid	13	300.00	0.00
T-7IMV5	tx-adwamuseum-1fec367e-bd13-4a8a-be9b-d6735a69da16	\N	invalid	3	500.00	0.00
T-299PD	tx-adwamuseum-1fec367e-bd13-4a8a-be9b-d6735a69da16	\N	invalid	3	500.00	0.00
T-D2JMI	tx-adwamuseum-2c2a82c6-037d-426a-b288-8f869249145a	\N	invalid	3	500.00	0.00
T-1D1VR	tx-adwamuseum-7993648f-7379-43d0-8e1c-c3100c6d1972	\N	invalid	13	300.00	0.00
T-798TB	tx-adwamuseum-2493278d-154b-485c-b027-29dc5045cfcb	\N	invalid	3	500.00	0.00
T-XB6P6	tx-adwamuseum-629444ac-f5f1-4439-9c95-546b6e36180e	\N	invalid	13	300.00	0.00
0aa49830-a6b4-41a1-8c2c-8f8fcc6f6453	dfb3925d-5f13-42f5-b2e5-16218da0c04c	\N	invalid	3	500.00	0.00
T-S7GMZ	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	3	500.00	0.00
T-HX7DY	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	3	500.00	0.00
T-811QT	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	4	100.00	0.00
T-091T3	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	4	100.00	0.00
T-YMZ53	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	5	300.00	0.00
T-UQIJU	tx-adwamuseum-d953535c-4786-45da-8cd4-4028d818f2af	\N	invalid	5	300.00	0.00
T-MB8JK	tx-adwamuseum-35ea0e61-602a-47c0-83ca-23c9a8fd46f2	\N	invalid	6	600.00	0.00
T-RF414	tx-adwamuseum-35ea0e61-602a-47c0-83ca-23c9a8fd46f2	\N	invalid	8	4.00	0.00
T-AV06R	tx-adwamuseum-35ea0e61-602a-47c0-83ca-23c9a8fd46f2	\N	invalid	2	500.00	0.00
T-TZLVY	tx-adwamuseum-35ea0e61-602a-47c0-83ca-23c9a8fd46f2	\N	invalid	13	300.00	0.00
T-3KAMG	tx-adwamuseum-e04969a1-c996-4202-a7c2-b9e391d55504	\N	invalid	13	300.00	0.00
T-09QE6	tx-adwamuseum-e04969a1-c996-4202-a7c2-b9e391d55504	\N	invalid	13	300.00	0.00
T-G6UL1	tx-adwamuseum-e04969a1-c996-4202-a7c2-b9e391d55504	\N	invalid	2	500.00	0.00
T-UU3LS	tx-adwamuseum-e04969a1-c996-4202-a7c2-b9e391d55504	\N	invalid	2	500.00	0.00
T-LL382	tx-adwamuseum-1ed30062-725a-4512-b789-bb413e53efa7	\N	invalid	13	300.00	0.00
T-XZF5K	tx-adwamuseum-1ed30062-725a-4512-b789-bb413e53efa7	\N	invalid	13	300.00	0.00
T-RGOUQ	tx-adwamuseum-1ed30062-725a-4512-b789-bb413e53efa7	\N	invalid	13	300.00	0.00
T-9QEAC	tx-adwamuseum-e482466b-6124-47b5-92c2-d74c663ff829	\N	invalid	8	4.00	0.00
T-VHS2B	tx-adwamuseum-e482466b-6124-47b5-92c2-d74c663ff829	\N	invalid	8	4.00	0.00
T-9A8CX	tx-adwamuseum-e482466b-6124-47b5-92c2-d74c663ff829	\N	invalid	8	4.00	0.00
T-P8FQI	tx-adwamuseum-e482466b-6124-47b5-92c2-d74c663ff829	\N	invalid	8	4.00	0.00
T-26KCU	tx-adwamuseum-fcbc50d6-53be-475d-b76f-fc7fab865684	\N	invalid	6	600.00	0.00
T-NTIG2	tx-adwamuseum-fcbc50d6-53be-475d-b76f-fc7fab865684	\N	invalid	6	600.00	0.00
T-1BYYN	tx-adwamuseum-fcbc50d6-53be-475d-b76f-fc7fab865684	\N	invalid	6	600.00	0.00
T-ML6PN	tx-adwamuseum-1c2a7416-c715-4e59-a405-fc940a9d6f86	\N	invalid	2	500.00	0.00
T-C3R0J	tx-adwamuseum-1c2a7416-c715-4e59-a405-fc940a9d6f86	\N	invalid	2	500.00	0.00
T-SARAE	tx-adwamuseum-a291c535-ae46-4be1-b43d-d36ad9cc56b3	\N	invalid	3	500.00	0.00
T-5ZC9B	tx-adwamuseum-a291c535-ae46-4be1-b43d-d36ad9cc56b3	\N	invalid	3	500.00	0.00
T-V5UWP	tx-adwamuseum-a291c535-ae46-4be1-b43d-d36ad9cc56b3	\N	invalid	3	500.00	0.00
T-W08XH	tx-adwamuseum-a2fde565-0855-40c7-bdc0-dd725429332a	\N	invalid	5	300.00	0.00
T-FIACB	tx-adwamuseum-a2fde565-0855-40c7-bdc0-dd725429332a	\N	invalid	5	300.00	0.00
T-4JVAG	tx-adwamuseum-a2fde565-0855-40c7-bdc0-dd725429332a	\N	invalid	5	300.00	0.00
T-8MNJ0	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	3	500.00	0.00
T-A9YQV	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	3	500.00	0.00
T-7N5QU	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	4	100.00	0.00
T-OL9YZ	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	4	100.00	0.00
T-XFLPM	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	5	300.00	0.00
T-GPLJM	tx-adwamuseum-e497a18d-90d8-4cf2-b2be-2fcb6735fbd3	\N	invalid	5	300.00	0.00
T-COAKM	tx-adwamuseum-558a11ac-2cfd-4a0f-b5f3-e17d9022c5a7	\N	invalid	3	500.00	0.00
T-434U1	tx-adwamuseum-558a11ac-2cfd-4a0f-b5f3-e17d9022c5a7	\N	invalid	3	500.00	0.00
66aa42aa-c3bf-4f45-9dce-f8637f5f36d2	b2f77f9c-ff7b-4254-8272-d7825b0620c2	\N	invalid	3	500.00	0.00
T-OPKYT	tx-adwamuseum-e83eadad-d57e-4274-b170-0f8a2f82f0b1	\N	invalid	3	500.00	0.00
4dfc3a90-8631-45bd-941c-e9b1cdb37c6c	228a48ba-dbc9-43dd-b4c3-680bd17f8e37	\N	invalid	3	500.00	0.00
8fee0dea-fce9-404d-bd8d-bb2094a9cbe2	228a48ba-dbc9-43dd-b4c3-680bd17f8e37	\N	invalid	4	100.00	0.00
T-47I3Y	tx-adwamuseum-258813c7-c108-413b-bd00-922484f0d017	\N	invalid	3	500.00	0.00
T-MKVLK	tx-adwamuseum-258813c7-c108-413b-bd00-922484f0d017	\N	invalid	4	100.00	0.00
T-V8NM7	tx-adwamuseum-258813c7-c108-413b-bd00-922484f0d017	\N	invalid	5	300.00	0.00
T-TTJC5	tx-adwamuseum-0ef8e562-080f-4921-b0f0-1daa627a458e	\N	invalid	3	500.00	0.00
T-F0XXS	tx-adwamuseum-0ef8e562-080f-4921-b0f0-1daa627a458e	\N	invalid	3	500.00	0.00
8dde056d-11b9-4850-8ae5-5661da566db6	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	2	500.00	0.00
aa4a624a-b161-4e8d-93a5-2195dc9ca9f3	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	3	500.00	0.00
3d16e92b-2968-42f4-bead-d48ba65fb054	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	4	100.00	0.00
0f68c4b7-448d-4914-8303-bf6c9156a9f1	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	5	300.00	0.00
b9adce7d-b6e6-4c26-bc4f-b73b982fae05	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	6	600.00	0.00
88e18b00-1404-4020-84ff-d9c1777e2918	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	8	4.00	0.00
0c33b2ce-8e06-43ce-973b-43be74caba58	4e42475c-6e8e-40ef-97e9-04680e15f898	\N	valid	13	300.00	0.00
6a12ce59-4a18-4468-b4ef-819946e3394c	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	2	500.00	0.00
9c628c74-aff5-43d0-9e9a-e02c24cbd751	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	3	500.00	0.00
4e767746-99d5-4bcf-809f-e1ac5d1181c9	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	4	100.00	0.00
e1584ca6-34b5-4207-8aa0-3678acf90737	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	5	300.00	0.00
a724fb95-c8a0-4896-9a32-36f9e2159ed9	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	6	600.00	0.00
72af3cd0-cb99-4f19-81b2-8624def8a35e	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	8	4.00	0.00
ff4bc4b3-1b7e-42cc-8982-e998e96304e3	89b8ec47-fd73-4e76-a36d-11639e4e7b95	\N	valid	13	300.00	0.00
9a17e71c-6fc2-4b30-b2f4-d26a1031b726	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	invalid	3	500.00	0.00
3dffa017-fdb6-45b2-9b85-c4ebee50c07a	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	invalid	4	100.00	0.00
78cfe8d2-7ba7-43f6-972c-0cbacdd1a164	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	valid	8	4.00	0.00
db95695f-f36d-4a97-8d70-e9e0bfb3393b	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	valid	13	300.00	0.00
1d2100fb-31e2-4fe0-a960-4e705af948da	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	invalid	2	500.00	0.00
2a508d42-0659-48b5-bb3e-a0eb7f0ba1bb	4e722916-1ec8-4756-aed0-196f4f4422f7	\N	invalid	5	300.00	0.00
T-UZ2H0	tx-adwamuseum-bbc7f09a-693d-40e5-8cc0-cec316bdacb9	\N	invalid	8	4.00	0.00
T-Y9AAJ	tx-adwamuseum-14fe53b7-de7f-4afc-ab4b-b95c879dac05	\N	invalid	13	300.00	0.00
9202a99e-c19d-4ea3-9920-5f3ebdaf0f81	052eb166-153f-436c-a2e7-224ba3028120	\N	valid	2	500.00	0.00
308637d0-bc33-45c6-bf76-e18195be010e	052eb166-153f-436c-a2e7-224ba3028120	\N	valid	2	500.00	0.00
8b841a86-013f-4eed-99e6-a278598db0ee	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
7c8a9bb8-b1f4-4c41-8b13-7f2ac710c052	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	4	90.00	10.00
a63cbf7d-e837-40c9-b1a9-a95bb27e7a32	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	5	300.00	0.00
dc2fc938-5de1-40da-b85a-05ae71e00d9e	7206899f-ffb0-448c-9ecc-f22706373577	\N	valid	8	4.00	0.00
45279804-ad1d-4c4f-b163-296a6170c710	71a0dc6b-bd78-4fda-85a2-6c3e74ac3da4	\N	invalid	3	500.00	0.00
9b1d79eb-9a46-40f8-9d75-afb856b6860e	3b3fd39d-4063-41de-86e8-ef39fbfaef93	\N	valid	13	300.00	0.00
e36d3ef6-cb40-4529-a4a6-a2bb1739cefa	9a1fa49b-6d84-4a54-80bc-b025de7fd873	\N	valid	3	500.00	0.00
T-DEUHL	tx-adwamuseum-139a5ed6-5f61-4f3a-845e-7317ac970b71	\N	invalid	4	\N	0.00
T-CP1BK	tx-adwamuseum-139a5ed6-5f61-4f3a-845e-7317ac970b71	\N	invalid	4	\N	0.00
50470218-2b49-4e17-b91a-046a3b4d0ba7	99342703-621e-4dee-8140-b4b7590a0aab	\N	valid	3	485.00	3.00
88bd0251-64f3-467d-a8cc-b6a1b944b964	99342703-621e-4dee-8140-b4b7590a0aab	\N	valid	3	485.00	3.00
b2a797d7-2126-40e4-a81b-9d5eb61d68dc	99342703-621e-4dee-8140-b4b7590a0aab	\N	valid	3	485.00	3.00
6b9f352e-e29e-4e19-bb16-01ff2eaff7d2	99342703-621e-4dee-8140-b4b7590a0aab	\N	valid	3	485.00	3.00
595c5b08-ecc8-4bac-b855-d53e4a89623f	99342703-621e-4dee-8140-b4b7590a0aab	\N	invalid	3	485.00	3.00
T-GFJ9P	tx-adwamuseum-c63d15cf-3ed3-4e17-a9dc-14b0de6645cb	\N	invalid	5	\N	0.00
T-8DFUJ	tx-adwamuseum-c63d15cf-3ed3-4e17-a9dc-14b0de6645cb	\N	invalid	5	\N	0.00
T-W8RN5	tx-adwamuseum-c52b2c30-33ae-4d9f-ae27-66ca46c87bc6	\N	invalid	5	\N	0.00
T-M9Q2H	tx-adwamuseum-c52b2c30-33ae-4d9f-ae27-66ca46c87bc6	\N	invalid	5	\N	0.00
T-RVAUL	tx-adwamuseum-921f10e9-a42c-4d63-9e9b-4887dd89d789	\N	invalid	5	\N	0.00
\.


--
-- Data for Name: contact_form; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_form (form_id, name, email, subject, message) FROM stdin;
1	John Doe	john@example.com	Booking Inquiry	I want to book the main hall for next week.
2	Jane Roe	jane@example.com	Facilities	Do you have parking available?
\.


--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department (id, department, status) FROM stdin;
4	curator	Active
3	security	Inactive
6	marketings	Active
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verifications (id, email, code, expires_at, created_at) FROM stdin;
6	lytsman@gmail.com	537998	2025-09-02 00:02:46.183	2025-09-01 23:47:46.184336
7	lytsman@gmail.com	311087	2025-09-02 00:04:27.479	2025-09-01 23:49:27.480837
8	luhenaabebe@gmail.com	763798	2025-09-02 00:07:04.72	2025-09-01 23:52:04.720718
11	owix5463@gmail.com	853815	2025-09-07 01:36:16.425	2025-09-07 01:21:16.42623
12	owix5463@gmail.com	680930	2025-09-07 01:38:26.569	2025-09-07 01:23:26.572807
13	adminfinal@example.aws	883425	2025-09-07 14:27:20.904	2025-09-07 14:12:20.906578
14	adminfinal@example.aws	333034	2025-09-07 14:28:41.973	2025-09-07 14:13:41.974393
15	adminfinal@example.aws	480430	2025-09-07 14:28:52.351	2025-09-07 14:13:52.35326
\.


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee (user_id, role_id, department, status) FROM stdin;
14	36	newdept	Active
15	37	adminefde	Active
16	38	adminefde	Active
17	38	adminefde	Active
18	37	adminefde	Active
19	37	adminefde	Active
20	39	adminefde	Active
21	40	adminefde	Active
22	41	adminefde	Active
23	41	adminefde	Active
24	42	adminefde	Active
25	42	adminefde	Active
26	26	adminefde	Active
27	26	adminefde	Active
28	26	adminefde	Active
30	26	adminefde	Active
31	26	adminefde	Active
32	26	adminefde	Active
33	42	adminefde	Active
8	25	administration	Active
29	26	adminefde	Active
34	26	adminefde	Active
49	45	administartion	Active
50	26	adminefde	Active
54	41	adminefde	Active
10	26	security	Active
55	25	curator	Active
56	25	marketings	Active
57	25	marketings	Active
58	51	marketings	Active
59	51	marketings	Active
60	49	curator	Active
62	40	marketings	Active
65	47	security	Active
66	47	security	Active
64	48	curator	Active
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event (event_id, title, description, date, start_time, end_time, no_of_attendee, status, created_at, updated_at, image_name, image_path, image_type, is_deleted, category_id, venue_id, title_am, description_am) FROM stdin;
47	Traditional Cooking Masterclass	Join us for the annual commemoration of Ethiopia's historic victory at the Battle of Adwa. This special event features historical reenactments, traditional music, and expert talks about the significance of this pivotal moment in African history.	2025-08-20	08:00:00	23:30:00	200	upcoming	2025-08-20 13:59:41.93684+03	2025-08-22 01:17:39.339124+03	hero-bg.png	uploads\\hero-bg.png-1755687581916-611187006	image/png	f	1	6	\N	\N
57	adwa	new	2025-09-27	02:00:00	02:30:00	100	upcoming	2025-09-06 23:01:04.97581+03	2025-09-10 00:36:33.148941+03	abrehot.webp	uploads\\abrehot.webp-1757188864940-351980318	image/webp	t	8	8	\N	\N
58	127	ryr	2025-09-22	00:00:00	01:30:00	56	upcoming	2025-09-10 02:26:56.090879+03	2025-09-10 02:28:26.069526+03	pie-chart.png	uploads\\pie-chart.png-1757460416075-402177469	image/png	t	2	8	345	ryry
56	123	ae	2025-08-25	11:00:00	23:30:00	100	upcoming	2025-08-25 11:38:16.960181+03	2025-09-10 02:28:41.867181+03	adwa-warriors-day.jpeg	uploads\\adwa-warriors-day.jpeg-1756111096936-274225658	image/jpeg	t	3	6	\N	\N
49	Ethiopian Heritage Workshop	Join us for the annual commemoration of Ethiopia's historic victory at the Battle of Adwa. This special event features historical reenactments, traditional music, and expert talks about the significance of this pivotal moment in African history.	2025-09-03	10:00:00	10:30:00	200	upcoming	2025-08-20 14:06:27.522681+03	2025-09-10 15:37:28.272271+03	adwa-museum-aerial.png	uploads\\adwa-museum-aerial.png-1755808324168-953356729	image/png	f	1	6	የኢትዮጵያ ቅርስ ወርክሾፕ	በዓመታዊው የኢትዮጵያ ታሪካዊ ድል በአድዋ ጦርነት ይሳተፉ። ይህ ልዩ ዝግጅት ታሪካዊ ድጋሚዎችን፣ ባህላዊ ሙዚቃዎችን እና ኤክስፐርቶችን በአፍሪካ ታሪክ ውስጥ ስላለው ወሳኝ ጊዜ አስፈላጊነት ይናገራሉ።
39	update	fsdfsdf	2025-08-30	01:30:00	12:30:00	23	upcoming	2025-08-19 00:46:40.626344+03	2025-08-20 15:09:04.684212+03	wallpaperflare.com_wallpaper (12).jpg	uploads\\wallpaperflare.com_wallpaper (12).jpg-1755557145892-942600474	image/jpeg	t	1	8	\N	\N
51	new updated	Join us for the annual commemoration of Ethiopia's historic victory at the Battle of Adwa. This special event features historical reenactments, traditional music, and expert talks about the significance of this pivotal moment in African history.	2025-08-23	09:30:00	16:00:00	300	upcoming	2025-08-20 16:47:08.688154+03	2025-08-20 16:49:11.50214+03	adwa-battlefield-model.jpeg	uploads\\adwa-battlefield-model.jpeg-1755697628655-857035579	image/jpeg	t	2	6	\N	\N
42	today	dfgdfg	2025-08-20	01:00:00	09:30:00	122	upcoming	2025-08-19 16:16:40.40691+03	2025-08-20 15:09:21.837054+03	wallpaperflare.com_wallpaper (13).jpg	uploads\\wallpaperflare.com_wallpaper (13).jpg-1755609400314-115023533	image/jpeg	t	3	8	\N	\N
50	axd	sd	2025-08-30	08:00:00	10:00:00	10	upcoming	2025-08-20 14:37:59.052755+03	2025-08-20 14:57:05.522266+03	adwa-warriors-day.jpeg	uploads\\adwa-warriors-day.jpeg-1755689879035-577896672	image/jpeg	t	3	6	\N	\N
52	Youth History Challenge	An enchanting evening of traditional Ethiopian music and dance performances by renowned local artists.	2025-08-29	12:00:00	16:00:00	190	upcoming	2025-08-21 20:59:18.71676+03	2025-08-22 01:21:24.402625+03	adwa-museum-interior.jpeg	uploads\\adwa-museum-interior.jpeg-1755808675969-394820905	image/jpeg	f	3	6	\N	\N
53	Battle of Adwa Anniversary Celebration	Join us for the annual commemoration of Ethiopia's historic victory at the Battle of Adwa. This special event features historical reenactments, traditional music, and expert talks about the significance of this pivotal moment in African history.	2025-08-22	14:00:00	23:30:00	500	upcoming	2025-08-21 23:29:30.378363+03	2025-08-21 23:41:09.705224+03	adwa-warriors-night.jpeg	uploads\\adwa-warriors-night.jpeg-1755808170365-360040353	image/jpeg	f	4	6	\N	\N
54	Archaeological Discoveries Lecture34	An enchanting evening of traditional Ethiopian music and dance performances by renowned local artists.	2025-08-26	09:30:00	19:00:00	120	upcoming	2025-08-21 23:47:54.881516+03	2025-08-22 01:22:31.240305+03	adwa-museum-aerial-night.jpeg	uploads\\adwa-museum-aerial-night.jpeg-1755814932731-956760	image/jpeg	t	4	6	\N	\N
40	addis new	sdfsdf	2025-08-20	02:30:00	09:30:00	342	upcoming	2025-08-19 00:51:18.312154+03	2025-08-20 15:09:18.642454+03	wallpaperflare.com_wallpaper (9).jpg	uploads\\wallpaperflare.com_wallpaper (9).jpg-1755557113067-452352184	image/jpeg	t	5	6	\N	\N
37	hello man	dfg	2025-08-30	02:00:00	06:30:00	453	upcoming	2025-08-18 23:22:01.53577+03	2025-08-20 15:09:09.145511+03	wallpaperflare.com_wallpaper (13).jpg	uploads\\wallpaperflare.com_wallpaper (13).jpg-1755558489282-790076969	image/jpeg	t	5	6	\N	\N
44	a	asdad	2025-08-26	01:30:00	09:00:00	12	upcoming	2025-08-19 17:44:07.949267+03	2025-08-19 23:26:54.536494+03	wallpaperflare.com_wallpaper (13).jpg	uploads\\wallpaperflare.com_wallpaper (13).jpg-1755614647912-345125512	image/jpeg	t	5	6	\N	\N
41	addis new yiseral	dfgdfg	2025-08-28	01:30:00	11:30:00	3453	upcoming	2025-08-19 01:02:08.684917+03	2025-08-20 15:09:13.49481+03	wallpaperflare.com_wallpaper (12).jpg	uploads\\wallpaperflare.com_wallpaper (12).jpg-1755554528661-95116805	image/jpeg	t	6	6	\N	\N
46	check2	any order	2025-08-21	06:00:00	08:00:00	300	upcoming	2025-08-20 13:55:37.186418+03	2025-08-22 01:18:05.107956+03	adwa-museum-interior.jpeg	uploads\\adwa-museum-interior.jpeg-1755687337180-73006977	image/jpeg	t	7	6	\N	\N
48	Archaeological Discoveries Lecture	Educational competition for students aged 12-18, testing knowledge of Ethiopian history and culture.	2025-08-31	14:00:00	16:30:00	200	upcoming	2025-08-20 14:02:40.476876+03	2025-08-22 01:17:01.35971+03	adwa-warriors-day.jpeg	uploads\\adwa-warriors-day.jpeg-1755687760461-376128308	image/jpeg	f	7	6	\N	\N
55	aw	asdasd	2025-08-27	11:00:00	18:30:00	200	upcoming	2025-08-25 11:35:12.683463+03	2025-08-25 11:35:12.683463+03	adwa-warriors-day.jpeg	uploads\\adwa-warriors-day.jpeg-1756110912653-625562086	image/jpeg	f	7	6	\N	\N
45	check	checking schedule	2025-08-31	14:00:00	18:00:00	200	upcoming	2025-08-20 13:40:13.20214+03	2025-08-20 14:55:30.748777+03	museum-shields-display.jpeg	uploads\\museum-shields-display.jpeg-1755686413168-727070769	image/jpeg	t	7	6	\N	\N
59	new year	Beyond our historical exhibitions, the Adwa Museum serves as a vibrant cultural hub, hosting educational programs, research initiatives, and community events that connect past achievements with present aspirations and future opportunities.	2025-09-17	08:00:00	23:00:00	500	upcoming	2025-09-12 22:07:54.78774+03	2025-09-12 22:07:54.78774+03	warriors.jpeg	uploads\\warriors.jpeg-1757704074744-902736028	image/jpeg	f	2	8	አዲስ አመት	ከታሪካዊ ኤግዚቢሽኖቻችን ባሻገር፣ የአድዋ ሙዚየም እንደ ደማቅ የባህል ማዕከል ሆኖ ያገለግላል፣ ትምህርታዊ ፕሮግራሞችን፣ የምርምር ውጥኖችን እና የማህበረሰብ ዝግጅቶችን በማስተናገድ ያለፉ ስኬቶችን ከአሁኑ ምኞት እና የወደፊት እድሎች ጋር የሚያገናኙ።
60	new	desc	2025-09-26	08:00:00	13:00:00	600	upcoming	2025-09-15 20:26:08.1724+03	2025-09-15 20:26:08.1724+03	wallpaperflare.com_wallpaper (9).jpg	uploads\\wallpaperflare.com_wallpaper (9).jpg-1757957168159-743739931	image/jpeg	f	2	8	new	new
\.


--
-- Data for Name: event_bought_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_bought_tickets (type_id, event_booking_id, status, ticket_id) FROM stdin;
00cee6bc-edec-4851-bf5f-31161c5645fa	8e552a4b-3c57-49d0-ac2b-3bc3408dd080	invalid	82
e3c3982a-3d05-4f9c-9429-22cf75b180cb	6fac5a53-739f-431c-8d9a-182cc994458e	Valid	88
2560886d-975e-4ef8-8acb-5f3f555b7e03	6fac5a53-739f-431c-8d9a-182cc994458e	Valid	88
819a6199-7a27-49c9-858a-709f9eded4a2	986a2948-3766-41a3-bee8-632ce01994b9	Valid	82
d68be0c3-76e5-4218-b328-1c5f8d5fc83a	986a2948-3766-41a3-bee8-632ce01994b9	Valid	83
e769f56c-ec13-401e-95f3-5542da834cab	986a2948-3766-41a3-bee8-632ce01994b9	Valid	85
7c72f0bd-de87-4b75-8b79-b78c77eb3a44	986a2948-3766-41a3-bee8-632ce01994b9	invalid	84
0985bea1-e61d-4141-96dc-69cdc12b328e	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	84
c114577f-6ac3-48dc-bc13-8313d4c40243	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
3cca027a-75ca-4283-946f-2090461804bc	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
ce1bface-af92-484b-b046-c3b09ba36a08	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
835f8dbb-6278-472c-bc2a-f667c43ed25c	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
35941a95-b68d-46ae-91b3-e207424258ba	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
d628bb49-efa9-408c-adca-38aa6d1afd60	b1cbf588-2997-46f8-917d-c16599ab217c	Valid	85
e64d9226-528f-4c4d-8320-8f288adf322d	9e90546e-f264-4533-a412-9592e6cc260a	Valid	82
84accf52-73b3-4fa9-b61f-209ebf454a4c	9e90546e-f264-4533-a412-9592e6cc260a	Valid	82
28686ed9-2ca2-4a04-bc43-1dd4e7561436	9e90546e-f264-4533-a412-9592e6cc260a	Valid	82
ecd22990-d3a6-4a20-a16e-cacba8089a08	9e90546e-f264-4533-a412-9592e6cc260a	Valid	83
4f47f279-061d-4d9f-a164-f64e056559e9	9e90546e-f264-4533-a412-9592e6cc260a	Valid	83
eccbbef3-677a-46b5-8a72-1f90bf6f41f4	9e90546e-f264-4533-a412-9592e6cc260a	Valid	83
d2d25226-42b9-43a9-b30e-664a49140c42	9e90546e-f264-4533-a412-9592e6cc260a	Valid	84
8926f763-cbf8-4e2d-8257-e74f54d5d6ac	9e90546e-f264-4533-a412-9592e6cc260a	Valid	84
b2a5f16a-60b1-4f7c-b782-a4eec98eed79	9e90546e-f264-4533-a412-9592e6cc260a	Valid	84
204647c2-7988-4270-940c-089fa94f3648	9e90546e-f264-4533-a412-9592e6cc260a	Valid	85
e8deebd8-cbe8-41d3-a9fd-85e2ee66dc7c	9e90546e-f264-4533-a412-9592e6cc260a	Valid	85
da22a86f-b96b-4dd4-9f82-4b96d02ef8b4	9e90546e-f264-4533-a412-9592e6cc260a	Valid	85
87c7318e-2b1f-4d45-985f-59399d18e23e	b1cbf588-2997-46f8-917d-c16599ab217c	invalid	82
d518be8b-3226-4997-8579-d5a5de439d8a	78281a8c-f629-4324-8d85-a79dc36fbda4	Valid	83
0422b6dc-107d-4d84-b72b-7d17477fcedb	78281a8c-f629-4324-8d85-a79dc36fbda4	Valid	85
de5aed3f-32cb-4ff6-ae83-e19f4d3e662a	3e2060e5-d28d-4ee3-ac49-de955929c4c7	Valid	88
310ae897-621c-43fc-b06f-9d36e6bdd76b	3e2060e5-d28d-4ee3-ac49-de955929c4c7	Valid	88
60efa2a9-5774-4ed0-b261-3cc347370123	16f18118-8d40-46bb-a089-bcd4dcb5750d	Valid	88
e1783bee-fab7-4c70-879d-00f2bbf575af	16f18118-8d40-46bb-a089-bcd4dcb5750d	Valid	88
644cf93e-0bce-401e-87a9-bfda859e1ec2	5d289197-0193-4352-9959-db590753716c	Valid	88
ab3fd3cc-97fa-45c6-b408-362b4e571b20	5d289197-0193-4352-9959-db590753716c	Valid	88
a8863689-b35e-4fbd-8f88-eee1bf028943	5d289197-0193-4352-9959-db590753716c	Valid	88
71141297-3380-41a7-9788-edcd222db4e3	65f38314-8dad-4fe8-8a3a-50977d5b4a14	Valid	94
09c0b4ab-b155-4397-88cf-10811e823a7e	65f38314-8dad-4fe8-8a3a-50977d5b4a14	Valid	94
5992f37b-5ee0-4c59-abeb-13721595b82e	78281a8c-f629-4324-8d85-a79dc36fbda4	invalid	82
c465b5e5-5d06-492c-a6ef-9e61ff990102	78281a8c-f629-4324-8d85-a79dc36fbda4	invalid	84
76f03c93-1c1f-4fb3-8432-33f25116f428	b1cbf588-2997-46f8-917d-c16599ab217c	invalid	83
4754fb62-4257-42d5-bb08-512fe79441c6	31b0f5cd-69a9-4a2e-9fb7-6b904cff22b2	Valid	82
00e4c622-ae55-4bf1-994b-32a43da2007d	31b0f5cd-69a9-4a2e-9fb7-6b904cff22b2	Valid	83
5d935199-5df4-489a-88d3-3e8ee37b4d59	e9d85930-fd39-4349-81d8-fe9b91b8605b	Valid	85
030f1097-2378-4ff4-80fa-204c1bed85da	e9d85930-fd39-4349-81d8-fe9b91b8605b	invalid	84
dad2025b-af71-46e1-8150-bbce9e290e9b	9e7408fd-3ce2-4ec4-85eb-88f6bc922e1b	Valid	54
1b25f500-2bbe-4747-ac0f-4c61e038f7df	b6664a8a-d4d9-4231-ac2d-0b92f159e207	Valid	82
dd3dba06-d514-4676-98bf-0c4032ebf9c5	da9feccd-2e66-4b31-b069-9549573c6731	Valid	84
11dfc6f6-f6b6-48bb-acea-0e7e482d213f	da9feccd-2e66-4b31-b069-9549573c6731	Valid	85
b38f6175-e853-4e91-a26f-5f527d4a37fc	8e552a4b-3c57-49d0-ac2b-3bc3408dd080	Valid	82
8e3ef389-66a1-4252-9240-632fd44b9a0d	411e463e-e375-4d73-8278-c01f12ca12ce	Valid	82
48ec8f8f-4212-4b73-860b-eb033609c5e3	411e463e-e375-4d73-8278-c01f12ca12ce	Valid	82
63bf5ea3-2f17-4227-8df4-a4c3af9bf6b6	f767840d-c6b8-42c6-8912-bcbe394880fb	Valid	84
f6dbf4dd-8012-4db8-b9b2-823993a51435	f767840d-c6b8-42c6-8912-bcbe394880fb	Valid	84
38df2e9c-98aa-4c53-8a5d-3da16508dc31	629b6980-06ce-4909-ba94-ebe6bd14817a	Valid	85
fa1b821a-a8a8-492e-84b6-bc35f479f393	59e1fb24-ccac-4c75-91d3-834f4f92dce2	Valid	90
847c15c9-19ad-430a-9ae6-cacfea3e0a29	b5cf9440-b9a8-48a7-95be-bef9f8a37976	Valid	89
156acfb4-7742-4d68-a7ac-962576895c4f	269cb06e-ca82-41fe-8bca-1f33da024642	Valid	96
733dbc28-79b8-45f0-916c-a4ac4658d789	fa1820f9-0838-434a-8702-0715b1e11d74	Valid	97
26281a70-85bf-440f-8946-6e0ef269e1cd	fa1820f9-0838-434a-8702-0715b1e11d74	Valid	97
d79b9365-0b5c-4a9d-a01b-dd2ba61ac04e	fa1820f9-0838-434a-8702-0715b1e11d74	Valid	98
b1358f4d-aab1-4785-be0a-64cbe5c01879	fa1820f9-0838-434a-8702-0715b1e11d74	Valid	98
0c230b79-81f7-4a4a-a725-2269efd0f51f	5d55c01d-9624-469b-bd84-955c1837925b	Valid	97
2d101e3d-e2b3-44f4-992e-337bfc4ec1f7	5d55c01d-9624-469b-bd84-955c1837925b	Valid	98
a18dedd8-55db-4178-8214-e5695c67500b	0521a851-504e-4678-bfb3-6e03826f1100	Valid	128
bbf60492-3706-451b-af76-97b37e3a03dc	2ca4ccf2-2fb0-4eb2-a10e-48b5ae6f18d2	Valid	128
92af15bd-8e46-476e-bf82-acd739cd5ec5	21a46385-cb96-4bfc-b7d1-5c261d4b8b30	Valid	97
63ded0ee-50aa-438a-844f-8f6adbbbf534	21a46385-cb96-4bfc-b7d1-5c261d4b8b30	Valid	98
adccb84b-9a55-4f92-a14e-db8f1e23c861	8bee7718-7d40-4722-bf70-d01dd04969df	Valid	97
99716843-8221-474e-aacb-8f2bb903ac4d	8bee7718-7d40-4722-bf70-d01dd04969df	Valid	97
10090edf-ed26-407e-a44c-00f99dd6b68a	8bee7718-7d40-4722-bf70-d01dd04969df	Valid	98
5b19725e-218c-4fbb-94a0-ce85bc617514	8bee7718-7d40-4722-bf70-d01dd04969df	Valid	98
122b20fb-fff5-4ac6-a6b1-2b7c70aac800	11426336-88e9-4d6c-8c5e-32fd954dd449	Valid	133
f89ae635-0071-48ff-8207-60aeb7f0d3b5	c6e2799e-bb7b-425f-9b83-433d3f8e497f	invalid	134
4fe6634c-1944-4b7d-91ed-402358d750cf	aee40be0-b590-476e-a577-9f441e4e1878	Valid	90
13940112-4ee3-4530-bb4e-f49d43179d08	1f8918a0-948d-4483-9f59-a02f9a8a1492	Valid	130
9d0edb5f-b91b-4dc7-9876-8d981483a953	1f8918a0-948d-4483-9f59-a02f9a8a1492	Valid	130
ec89c074-c3d4-4de0-98ab-891f302820cf	c0ccae54-50e0-49e2-b272-f087b9ae7afc	Valid	130
818f8633-685a-46a5-9f27-5c2223e31832	c0ccae54-50e0-49e2-b272-f087b9ae7afc	invalid	130
1fb34023-7f0c-4673-aca3-58c8cc469d6a	5968a704-7040-4eee-9d98-1b51af637424	Valid	135
d6ad82f0-ba26-4310-a45e-61c21b71ad9e	876c570a-835a-49ae-9510-0afadd1008f7	Valid	137
533ac75f-dfac-44b1-b822-9ffe5d732568	72f3c790-ca37-408f-8c7f-5f626985ea8d	Valid	137
eb81ac4e-63b1-4d77-bd4d-9971e7062782	e452bd84-29f3-4e6f-aa1a-eb421321a164	Valid	137
40137c64-d4a9-4b0c-86bb-b80e7297a2ec	961916f2-9b5c-42c7-9b5a-091b2b111e22	Valid	137
8a92b669-7356-4d63-8687-1fa5108e75f2	1fc4202e-83c6-4895-a548-86f2c19f23f2	Valid	137
58e6d222-2650-4606-bb8c-e10257f09b81	1fc4202e-83c6-4895-a548-86f2c19f23f2	Valid	137
9c468aad-e427-453a-9235-8a5c16034bd3	20f2a903-622e-4a03-a6cf-a7aeffe3f100	Valid	137
32edf980-d455-4fe1-98ce-cd1ffa858998	20f2a903-622e-4a03-a6cf-a7aeffe3f100	Valid	137
b82852ce-0fdc-49a1-97b1-9ab7c251f4ab	a53397ff-4abe-4264-8300-d2bf3c14c3c6	Valid	137
\.


--
-- Data for Name: event_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_category (id, category, status, is_deleted, category_am) FROM stdin;
8	category	active	t	\N
9	n1	active	t	am4
1	Art	active	f	ስነ ጥበብ
2	Culture	active	f	 ባህል
3	Education	active	f	ትምህርት
4	History	active	f	 ታሪክ
5	Performance	active	f	 አፈጻጸም
6	Workshop	active	f	 ወርክሾፕ
7	Youth	active	f	 ወጣቶች
\.


--
-- Data for Name: event_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_info (event_booking_id, event_id, full_name, email, phone_no, ticket_no, paid_amount, bought_at, attendance, walkin, is_logged) FROM stdin;
78281a8c-f629-4324-8d85-a79dc36fbda4	42	luhena	Lytsman56@gmail.com	0944357340	4	989.00	2025-08-19 22:57:23.637461+03	Confirmed	no	f
EVT001	37	Carol White	luhenaabebe086@gmail.com	1122334455	2	600.00	2025-07-23 15:22:40.333764+03	Confirmed	no	f
31b0f5cd-69a9-4a2e-9fb7-6b904cff22b2	42	luhena	Lytsman56@gmail.com	0944357340	2	445.00	2025-08-19 23:12:48.115875+03	Confirmed	no	f
e9d85930-fd39-4349-81d8-fe9b91b8605b	42	luhena	Lytsman56@gmail.com	0944357340	2	544.00	2025-08-19 23:23:25.002482+03	Confirmed	no	f
3f205c49-24ff-4626-83ed-890d495aef19	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	1000.00	2025-08-19 16:54:01.476636+03	Confirmed	yes	f
cfb6f39a-88e4-4202-abec-a3b392641afa	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	1000.00	2025-08-19 17:08:55.205308+03	Confirmed	yes	f
10b7927d-6ae1-4a5c-8f99-adc56f22aea3	42	Walk-in Guest	adwa@adwavictory.com	0000000000	1	500.00	2025-08-19 17:12:26.123272+03	Confirmed	yes	f
acb420e7-09e5-4b91-ad58-09a1cc03fe38	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	1000.00	2025-08-19 17:30:25.351608+03	Confirmed	yes	f
9adf9e44-55b6-4222-85c7-33cbb9290e32	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	1000.00	2025-08-19 17:33:55.744434+03	Confirmed	yes	f
140c5826-7158-4dcb-b3e4-1893918d1146	42	Walk-in Guest	adwa@adwavictory.com	0000000000	123	61500.00	2025-08-19 17:56:59.978516+03	Confirmed	yes	f
e887c5d8-9ac8-49a2-be98-81b86cc9bbf8	42	Walk-in Guest	adwa@adwavictory.com	0000000000	50	25000.00	2025-08-19 18:05:07.674383+03	Confirmed	yes	f
9ae2a165-7c3a-48e5-9400-5630bb535a27	42	Walk-in Guest	adwa@adwavictory.com	0000000000	9	2370.00	2025-08-19 21:46:33.08929+03	Confirmed	yes	f
5167874b-be5c-43e9-acd2-0c96921e1dc5	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	1000.00	2025-08-19 21:48:27.00665+03	Confirmed	yes	f
986a2948-3766-41a3-bee8-632ce01994b9	42	Walk-in Guest	adwa@adwavictory.com	0000000000	4	989.00	2025-08-19 22:24:25.108435+03	Confirmed	no	f
b1cbf588-2997-46f8-917d-c16599ab217c	42	luhena	Lytsman56@gmail.com	0944357340	9	3489.00	2025-08-19 22:41:40.992997+03	Confirmed	no	f
9e90546e-f264-4533-a412-9592e6cc260a	42	luhena	Lytsman56@gmail.com	0944357340	12	2967.00	2025-08-19 22:43:13.062147+03	Confirmed	no	f
9e7408fd-3ce2-4ec4-85eb-88f6bc922e1b	39	luhena	Lytsman56@gmail.com	0944357340	1	123.00	2025-08-20 00:38:11.197135+03	Confirmed	no	f
b6664a8a-d4d9-4231-ac2d-0b92f159e207	42	luhena	Lytsman56@gmail.com	0944357340	1	100.00	2025-08-20 00:53:24.758553+03	Confirmed	no	f
da9feccd-2e66-4b31-b069-9549573c6731	42	luhena	Lytsman56@gmail.com	0944357340	2	544.00	2025-08-20 01:02:20.690904+03	Confirmed	no	f
8e552a4b-3c57-49d0-ac2b-3bc3408dd080	42	luhena	Lytsman56@gmail.com	0944357340	2	200.00	2025-08-20 01:05:23.285107+03	Confirmed	no	f
411e463e-e375-4d73-8278-c01f12ca12ce	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	200.00	2025-08-20 01:07:34.85336+03	Confirmed	no	f
f767840d-c6b8-42c6-8912-bcbe394880fb	42	Walk-in Guest	adwa@adwavictory.com	0000000000	2	88.00	2025-08-20 01:10:13.097073+03	Confirmed	no	f
629b6980-06ce-4909-ba94-ebe6bd14817a	42	luhena	events@venue.com	0944357340	1	500.00	2025-08-20 01:12:45.136691+03	Confirmed	no	f
6fac5a53-739f-431c-8d9a-182cc994458e	47	Walk-in Guest	adwa@adwavictory.com	0000000000	2	400.00	2025-08-20 19:30:35.262271+03	Confirmed	no	f
3e2060e5-d28d-4ee3-ac49-de955929c4c7	47	Walk-in Guest	adwa@adwavictory.com	0000000000	2	400.00	2025-08-20 19:44:40.793806+03	Confirmed	no	f
16f18118-8d40-46bb-a089-bcd4dcb5750d	47	Walk-in Guest	adwa@adwavictory.com	0000000000	2	400.00	2025-08-20 19:47:05.00791+03	Confirmed	no	t
5d289197-0193-4352-9959-db590753716c	47	Walk-in Guest	adwa@adwavictory.com	0000000000	3	600.00	2025-08-20 19:50:09.316846+03	Confirmed	no	t
65f38314-8dad-4fe8-8a3a-50977d5b4a14	47	Walk-in Guest	adwa@adwavictory.com	0000000000	2	400.00	2025-08-20 20:02:49.457492+03	Confirmed	no	t
59e1fb24-ccac-4c75-91d3-834f4f92dce2	49	lyts	luhenaabebe086@gmail.com	0944357340	1	200.00	2025-08-21 20:36:27.549662+03	Confirmed	no	f
b5cf9440-b9a8-48a7-95be-bef9f8a37976	48	lyts	luhenaabebe086@gmail.com	0944357340	1	200.00	2025-08-21 20:42:24.753889+03	Confirmed	no	f
269cb06e-ca82-41fe-8bca-1f33da024642	52	lyts	luhenaabebe086@gmail.com	0944357340	1	100.00	2025-08-21 21:00:15.625957+03	Confirmed	no	f
fa1820f9-0838-434a-8702-0715b1e11d74	53	Walk-in Guest	adwa@adwavictory.com	0000000000	4	1500.00	2025-08-22 01:26:50.907966+03	Confirmed	no	t
5d55c01d-9624-469b-bd84-955c1837925b	53	lyts	luhenaabebe086@gmail.com	0944357340	2	750.00	2025-08-22 01:32:27.302962+03	Confirmed	no	f
0521a851-504e-4678-bfb3-6e03826f1100	48	lyts	tickets@venue.com	0944357340	1	100.00	2025-08-22 02:29:13.075992+03	Confirmed	no	f
2ca4ccf2-2fb0-4eb2-a10e-48b5ae6f18d2	48	lyts	luhenaabebe086@gmail.com	0944357340	1	100.00	2025-08-22 02:31:02.693579+03	Confirmed	no	f
21a46385-cb96-4bfc-b7d1-5c261d4b8b30	53	lyts	marketing@venue.com	0944357340	2	750.00	2025-08-22 02:39:22.852432+03	Confirmed	no	f
8bee7718-7d40-4722-bf70-d01dd04969df	53	lyts	luhenaabebe086@gmail.com	0944357340	4	1500.00	2025-08-22 03:29:34.326514+03	Confirmed	no	f
11426336-88e9-4d6c-8c5e-32fd954dd449	55	lyts	luhenaabebe086@gmail.com	0944357340	1	123.00	2025-08-25 11:39:09.480869+03	Confirmed	no	f
c6e2799e-bb7b-425f-9b83-433d3f8e497f	56	lyts	luhenaabebe086@gmail.com	0944357340	1	100.00	2025-08-25 11:41:25.713809+03	Confirmed	no	f
aee40be0-b590-476e-a577-9f441e4e1878	49	Walk-in Guest	adwa@adwavictory.com	0912345678	1	200.00	2025-09-03 00:43:45.003844+03	Confirmed	no	t
1f8918a0-948d-4483-9f59-a02f9a8a1492	49	luhena	luhenaabebe086@gmail.com	0944357340	2	400.00	2025-09-03 01:45:52.104175+03	Confirmed	no	f
c0ccae54-50e0-49e2-b272-f087b9ae7afc	49	luhena	luhenaabebe086@gmail.com	0944357340	2	400.00	2025-09-03 01:59:24.046406+03	Confirmed	no	f
5968a704-7040-4eee-9d98-1b51af637424	57	luhena	luhenaabebe086@gmail.com	0944357340	1	400.00	2025-09-07 12:47:47.338939+03	Confirmed	no	f
876c570a-835a-49ae-9510-0afadd1008f7	59	luhena	abebetamrat21@gmail.com	0944357340	1	400.00	2025-09-12 22:23:22.669542+03	Confirmed	no	f
72f3c790-ca37-408f-8c7f-5f626985ea8d	59	ሉሃና	abebetamrat21@gmail.com	0944357340	1	400.00	2025-09-12 22:30:46.092768+03	Confirmed	no	f
e452bd84-29f3-4e6f-aa1a-eb421321a164	59	ሉሃና	abebetamrat21@gmail.com	0944357340	1	400.00	2025-09-12 22:40:03.413756+03	Confirmed	no	f
961916f2-9b5c-42c7-9b5a-091b2b111e22	59	luhena	abebetamrat21@gmail.com	0944357340	1	400.00	2025-09-12 22:56:52.064523+03	Confirmed	no	f
1fc4202e-83c6-4895-a548-86f2c19f23f2	59	luhena	abebetamrat21@gmail.com	0944357340	2	800.00	2025-09-12 23:02:42.996048+03	Confirmed	no	f
20f2a903-622e-4a03-a6cf-a7aeffe3f100	59	luhena	abebetamrat21@gmail.com	0944357340	2	800.00	2025-09-12 23:15:54.458258+03	Confirmed	no	f
a53397ff-4abe-4264-8300-d2bf3c14c3c6	59	luhena	luhenaabebe086@gmail.com	0944357340	1	400.00	2025-09-15 20:02:07.925084+03	Confirmed	no	f
\.


--
-- Data for Name: event_ticket_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_ticket_types (ticket_id, event_id, type, price, description, feature, ticket_limit, status, is_deleted, type_am, description_am, features_am) FROM stdin;
68	44	wqw	23	fs	fsfd	90	active	t	\N	\N	\N
54	39	sdfsdf	123	asd	asdad	\N	active	t	\N	\N	\N
58	37	dfg	345	dg	dfg	\N	active	t	\N	\N	\N
50	41	ert	345	dfg	dfg	345	active	t	\N	\N	\N
53	40	sdf	234	sdf	sdf	\N	active	t	\N	\N	\N
86	45	general	200	new ticket type	premium feature	90	active	t	\N	\N	\N
91	50	sd	2	sd	sd	23	active	t	\N	\N	\N
92	51	vip	599	premium expr	food	57	active	t	\N	\N	\N
133	55	de	123	ZX	asda, asd	19	active	f	\N	\N	\N
96	52	asd	100	zxc	zxc	11	active	t	\N	\N	\N
135	57	new	400	new	new	11	active	t	\N	\N	\N
130	49	Standard	200	basic service	premium	16	active	f	መደበኛ	መሰረታዊ አገልግሎት	ፕሪሚየም
99	49	Standard	200	All access	Refreshments, Free seat	49	active	t	\N	\N	\N
126	48	VVIP	200	new	new	2	active	t	\N	\N	\N
121	48	VIP	200	new	new	10	active	t	\N	\N	\N
117	48	and	20	new	new	50	active	t	\N	\N	\N
89	48	ch4	200	new	new	119	active	t	\N	\N	\N
101	48	General	200	new	updated	119	active	t	\N	\N	\N
102	48	VIP	500	Allow access	Good	2	active	t	\N	\N	\N
110	48	New	300	new	new	10	active	t	\N	\N	\N
104	48	General VIP	300	new	Priority	12	active	t	\N	\N	\N
112	48	addis 3	200	new	new	3	active	t	\N	\N	\N
116	48	new 23	200	new	new	50	active	t	\N	\N	\N
119	48	sim	23	sdf	sdf	23	active	t	\N	\N	\N
123	48	Student	50	new	new	12	active	t	\N	\N	\N
125	48	123	200	ddg	dfg	1	active	t	\N	\N	\N
132	52	Standard	200	new	premium	20	active	f	\N	\N	\N
94	47	vip	200	dfg	dfg	28	active	t	\N	\N	\N
114	47	new 3	300	new	new	10	active	t	\N	\N	\N
106	54	VIP	100	new	access	100	active	t	\N	\N	\N
108	54	VIP	100	new	access2	100	active	t	\N	\N	\N
137	59	VIP	400	good	good, best	41	active	f	ከአሰ	በጣም አሪፍ ነው	ጥሩ
138	60	regular	300	desc	good	500	active	f	reg	desc	good
128	48	Student	100	new	new	10	active	f	\N	\N	\N
82	42	helo	100	dfg	dfg	85	active	t	\N	\N	\N
84	42	newnew	44	fg	fg	35	active	t	\N	\N	\N
85	42	addis	500	asd	asd	284	active	t	\N	\N	\N
83	42	tata	345	fgh	fgh	187	active	t	\N	\N	\N
136	58	ert	345	ert	ert, et	45	active	t	et	ert	ertet, 54645
134	56	sw	100	as	as, as, we	9	active	t	\N	\N	\N
90	49	ch	200	new	old	48	active	t	\N	\N	\N
122	48	Premium	200	new	new	20	active	f	\N	\N	\N
127	48	General45	200	new	new	10	active	f	\N	\N	\N
120	48	General	500	new	new	48	active	t	\N	\N	\N
100	52	General	100	Every access 	Priority access	11	active	t	\N	\N	\N
103	52	General	200	New	Best	12	active	t	\N	\N	\N
105	48	new	43	df	df	3	active	t	\N	\N	\N
109	48	New	200	new	new	10	active	t	\N	\N	\N
111	48	addis	123	xcv	xcv	1	active	t	\N	\N	\N
118	48	besintu	200	new	new	50	active	t	\N	\N	\N
88	47	old3	200	new	new	141	active	t	\N	\N	\N
95	47	new	12	gdfg	dfg	34	active	t	\N	\N	\N
113	47	General	200	new	priority	10	active	t	\N	\N	\N
115	47	Event	200	vip	priority	50	active	t	\N	\N	\N
124	48	new	200	new	new	21	active	t	\N	\N	\N
129	47	General	200	new	new	10	active	f	\N	\N	\N
93	46	new	34	er	sf	34	active	t	\N	\N	\N
87	46	fikir	300	new	old	120	active	t	\N	\N	\N
131	54	General	200	good	new	10	active	t	\N	\N	\N
107	54	new	123	new	new	20	active	t	\N	\N	\N
97	53	General	250	Allow the participants to view the show	Priority access, Tour guid	244	active	f	\N	\N	\N
98	53	Vip	500	Includes catering	Premium experience	244	active	f	\N	\N	\N
\.


--
-- Data for Name: facilities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facilities (id, service_id, name, description, capacity, price_per_hour, img_name, img_path, img_type, status) FROM stdin;
1	1	Main Hall	Spacious event hall	200	150.00	hall.jpg	/images/hall.jpg	image/jpeg	Available
2	2	Conference Room	Projector and mic included	50	100.00	conf.jpg	/images/conf.jpg	image/jpeg	Available
\.


--
-- Data for Name: facility_facility_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facility_facility_items (id, facility_id, facility_item_id) FROM stdin;
1	1	1
2	2	2
\.


--
-- Data for Name: facility_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facility_items (id, name, description, status) FROM stdin;
1	Projector	HD projector for presentations	Available
2	Sound System	Speakers and microphones	Available
\.


--
-- Data for Name: feedback_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback_responses (id, survey_id, session_id, language, status, completed, overall_rating, respondent_meta, ip_address, user_agent, submitted_at, created_at, updated_at) FROM stdin;
1	1	session_001	en	completed	t	4.50	{}	\N	\N	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
2	1	session_002	en	completed	t	5.00	{}	\N	\N	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
3	1	session_003	en	completed	t	3.80	{}	\N	\N	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
4	2	session_004	am	completed	t	4.20	{}	\N	\N	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
5	2	session_005	am	completed	t	4.70	{}	\N	\N	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
6	1	session_1757690513723	en	completed	t	\N	{}	\N	\N	2025-09-12 18:21:53.959406+03	2025-09-12 18:21:53.959406+03	2025-09-12 18:21:53.959406+03
7	2	session_1757690694209	am	completed	t	\N	{}	\N	\N	2025-09-12 18:24:54.451412+03	2025-09-12 18:24:54.451412+03	2025-09-12 18:24:54.451412+03
8	1	session_1757690858985	en	completed	t	\N	{}	\N	\N	2025-09-12 18:27:39.232228+03	2025-09-12 18:27:39.232228+03	2025-09-12 18:27:39.232228+03
9	1	session_1757699621079	en	completed	t	\N	{}	\N	\N	2025-09-12 20:53:41.293699+03	2025-09-12 20:53:41.293699+03	2025-09-12 20:53:41.293699+03
10	1	session_1757699724464	en	completed	t	\N	{}	\N	\N	2025-09-12 20:55:24.576792+03	2025-09-12 20:55:24.576792+03	2025-09-12 20:55:24.576792+03
11	1	session_1757699960470	en	completed	t	\N	{}	\N	\N	2025-09-12 20:59:20.668563+03	2025-09-12 20:59:20.668563+03	2025-09-12 20:59:20.668563+03
12	1	session_1757701696424	en	completed	t	\N	{}	\N	\N	2025-09-12 21:28:16.613779+03	2025-09-12 21:28:16.613779+03	2025-09-12 21:28:16.613779+03
13	1	session_1757713018040	en	completed	t	\N	{}	\N	\N	2025-09-13 00:36:58.091877+03	2025-09-13 00:36:58.091877+03	2025-09-13 00:36:58.091877+03
14	1	session_1757713233719	en	completed	t	\N	{}	\N	\N	2025-09-13 00:40:33.79784+03	2025-09-13 00:40:33.79784+03	2025-09-13 00:40:33.79784+03
15	1	session_1757713389126	en	completed	t	\N	{}	\N	\N	2025-09-13 00:43:09.203074+03	2025-09-13 00:43:09.203074+03	2025-09-13 00:43:09.203074+03
16	1	session_1757713561238	en	completed	t	\N	{}	\N	\N	2025-09-13 00:46:01.291674+03	2025-09-13 00:46:01.291674+03	2025-09-13 00:46:01.291674+03
17	2	session_1757714961586	am	completed	t	\N	{}	\N	\N	2025-09-13 01:09:21.595464+03	2025-09-13 01:09:21.595464+03	2025-09-13 01:09:21.595464+03
18	2	session_1757715181841	am	completed	t	\N	{}	\N	\N	2025-09-13 01:13:01.972537+03	2025-09-13 01:13:01.972537+03	2025-09-13 01:13:01.972537+03
19	2	session_1757715221520	am	completed	t	\N	{}	\N	\N	2025-09-13 01:13:41.75536+03	2025-09-13 01:13:41.75536+03	2025-09-13 01:13:41.75536+03
20	1	session_1757957986140	en	completed	t	\N	{}	\N	\N	2025-09-15 20:39:46.210826+03	2025-09-15 20:39:46.210826+03	2025-09-15 20:39:46.210826+03
21	1	session_1757958106169	en	completed	t	\N	{}	\N	\N	2025-09-15 20:41:46.230949+03	2025-09-15 20:41:46.230949+03	2025-09-15 20:41:46.230949+03
\.


--
-- Data for Name: group_discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_discounts (discount_id, ticket_id, min_group_size, discount_percent) FROM stdin;
4	2	6	3.00
5	5	7	2.00
6	13	3	3.00
7	6	5	5.00
8	3	5	3.00
\.


--
-- Data for Name: image_galleries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_galleries (id, page_name, section_name, file_url, file_type, alt_text, caption, display_order, is_active, created_at, updated_at, title_am, description_am) FROM stdin;
123	about	journey_timeline	http://localhost:8080/uploads/content-images/65dd7850f37a55b8d6a70d6c64881ccd	image/jpeg	Journey Timeline Image 4		3	t	2025-08-25 23:44:44.774525	2025-08-27 00:14:44.526909	\N	\N
124	about	journey_timeline	http://localhost:8080/uploads/content-images/bcb908875e7e43e362afaead861e395a	image/webp	Journey Timeline Image 5		4	t	2025-08-25 23:45:37.740371	2025-08-27 00:16:02.814704	\N	\N
190	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/ddce183ef0ba0acc76e150d763233f4d	image	Museum Architecture	Museum Architecture	6	t	2025-09-02 19:15:07.244677	2025-09-10 15:29:41.661086	t72	d72
191	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/6e0e0a9d5766e6d10dc2631dfe220562	image	Museum Architecture	Museum Architecture	7	t	2025-09-02 19:15:07.272568	2025-09-10 15:29:41.672819	h82	h92
154	about	journey_timeline	http://localhost:8080/uploads/content-images/8cb56a658cfc6f7d7a5189bc98657138	image/jpeg	Journey Timeline Image 3		2	t	2025-08-27 00:08:31.301916	2025-08-27 00:19:55.183061	\N	\N
195	about	carousel_images	http://localhost:8080/uploads/content-images/4db89525700e06e459364f9518e14400	image/webp	About Carousel Image 5		4	t	2025-09-12 12:24:25.955474	2025-09-12 12:24:25.955474	\N	\N
196	about	carousel_images	http://localhost:8080/uploads/content-images/5118f7ea1ea1ac75c9a2fea03bb131a4	image/jpeg	About Carousel Image 6		5	t	2025-09-12 12:24:26.006812	2025-09-12 12:24:26.006812	\N	\N
174	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/794f46b8e70dc392f03c4331e426a4ad	image	1Imperial Heritage Diisplay	Royal artifacts and ceremonial regalia	0	t	2025-09-02 13:03:23.681941	2025-09-10 15:29:41.588299	ኢምፔሪያል ቅርስ ማሳያ	ኢምፔሪያል ቅርስ ማሳያ
155	about	journey_timeline	http://localhost:8080/uploads/content-images/c402d9c5bed54c03be16f8a6bc5e53a9	image/jpeg	Journey Timeline Image 6		5	t	2025-08-27 00:21:20.225483	2025-09-02 13:02:44.166155	\N	\N
143	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/64606500c5a32f52973a16b7a779d498	image	Military History Wing	Celebrating Ethiopia's rich cultural heritage	1	t	2025-08-26 02:07:05.717306	2025-09-10 15:29:41.605558	i22	d22
186	about	carousel_images	http://localhost:8080/uploads/content-images/055f76f2e4a625315736a8abb42e00a9	image/webp	About Carousel Image 1		0	t	2025-09-02 19:13:32.525025	2025-09-02 19:13:32.525025	\N	\N
187	about	carousel_images	http://localhost:8080/uploads/content-images/a239ab332c4ac7d0b2acf67d62c9e6c7	image/jpeg	About Carousel Image 2		1	t	2025-09-02 19:13:32.555655	2025-09-02 19:13:32.555655	\N	\N
188	about	carousel_images	http://localhost:8080/uploads/content-images/94b4c282205e600b53abb12c7dc47ff8	image/jpeg	About Carousel Image 3		2	t	2025-09-02 19:13:32.579825	2025-09-02 19:13:32.579825	\N	\N
189	about	carousel_images	http://localhost:8080/uploads/content-images/8c3a294d12bee19266626357dd6b862c	image/jpeg	About Carousel Image 4		3	t	2025-09-02 19:13:32.610475	2025-09-02 19:13:32.610475	\N	\N
145	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/b98eec416e83242804cffbaa5bddbd95	image	Historic Battlefield	The site where history was made	2	t	2025-08-26 16:38:43.749834	2025-09-10 15:29:41.616996	t32	d32
192	about	journey_timeline	http://localhost:8080/uploads/content-images/4719b8caeb8ef2bdc18f3b1b604be568	image/png	Journey Timeline Image 7		6	t	2025-09-09 22:31:12.46827	2025-09-09 22:34:37.005246	\N	\N
146	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/47df802e645f1866005876552f8c47ba	image	Museum Architecture	Aerial view of our modern facility	3	t	2025-08-26 17:19:31.932049	2025-09-10 15:29:41.627285	d42	d42
156	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/b0658e589900a4295a7130198fbd0555	image	Museum Architecture	Aerial view of our modern facility	4	t	2025-08-27 02:20:45.786247	2025-09-10 15:29:41.637701	t52	d52
176	exhibition	exhibition_media	http://localhost:8080/uploads/content-images/07e7eb059fe74677fbd1df3e2e913897	image	Museum Architecture	Museum Architecture	5	t	2025-09-02 18:36:28.84984	2025-09-10 15:29:41.648564	d62	t62
149	about	journey_timeline	http://localhost:8080/uploads/content-images/fb5c3460a5663e0aae84306b665e3dd3	image/jpeg	Journey Timeline Image 1		0	t	2025-08-26 18:46:47.235482	2025-09-02 10:28:21.460468	\N	\N
153	about	journey_timeline	http://localhost:8080/uploads/content-images/9d8a1a1d0ce6121e2957d9f82b45043d	image/png	Journey Timeline Image 2		1	t	2025-08-27 00:06:13.299649	2025-08-27 00:06:13.299649	\N	\N
104	home	about_images	http://localhost:8080/uploads/content-images/f3cdb895669c7077fa9025f8641abe32	image/png	Home About Image 2		1	t	2025-08-25 00:50:00.128513	2025-09-02 14:46:19.460093	\N	\N
105	home	about_images	http://localhost:8080/uploads/content-images/cbd83c872e6b3ee8c13ad86a0bc789aa	image/jpeg	Home About Image 3		2	t	2025-08-25 00:50:00.128513	2025-09-02 14:46:19.483693	\N	\N
103	home	about_images	http://localhost:8080/uploads/content-images/0df87ec71f539c5d545d9467aa8045b2	image/jpeg	Home About Image 1		0	t	2025-08-25 00:50:00.128513	2025-09-02 14:47:20.993374	\N	\N
106	home	about_images	http://localhost:8080/uploads/content-images/90e4a9b856357f99beb1b88896383f6c	image/webp	Home About Image 4		3	t	2025-08-25 00:50:00.128513	2025-09-02 14:47:21.030566	\N	\N
\.


--
-- Data for Name: journey_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journey_timeline (id, date, title, description, image_url, display_order, is_active, created_at, updated_at, title_am, description_am) FROM stdin;
1	1896-03-01	Battle of Adwa	Ethiopian forces defeat Italian colonial army, preserving independence and inspiring African liberation movements worldwide.	http://localhost:8080/uploads/content-images/fb5c3460a5663e0aae84306b665e3dd3	0	t	2025-08-25 10:59:47.487275	2025-09-12 12:24:26.312981	የአድዋ ጦርነት	የኢትዮጵያ ጦር የጣሊያን ቅኝ ገዥ ጦርን አሸንፎ፣ ነፃነትን በማስጠበቅ እና የአፍሪካን የነጻነት ንቅናቄን በዓለም አቀፍ ደረጃ አነሳሳ።
2	2023-05-05	Museum Concept Born	Emperor Haile Selassie I initiates plans to commemorate the historic victory with a dedicated cultural institution.	http://localhost:8080/uploads/content-images/9d8a1a1d0ce6121e2957d9f82b45043d	1	t	2025-08-25 11:01:53.326107	2025-09-12 12:24:26.314505	ሙዚየም ጽንሰ-ሐሳብ ተወለደ	ንጉሠ ነገሥት ቀዳማዊ ኃይለ ሥላሴ በተሰጠ የባህል ተቋም ታሪካዊውን ድል ለማስታወስ አቅደዋል።
13	2023-07-10	Foundation Ceremony	Construction begins on the museum complex in Addis Ababa with support from UNESCO and cultural organizations.	http://localhost:8080/uploads/content-images/8cb56a658cfc6f7d7a5189bc98657138	2	t	2025-08-26 18:48:54.186301	2025-09-12 12:24:26.316469	የመሠረት ሥነ ሥርዓት	በዩኔስኮ እና የባህል ድርጅቶች ድጋፍ በአዲስ አበባ የሚገኘው ሙዚየም ግቢ ግንባታ ተጀመረ።
24	2024-01-10	Centennial Grand Opening	Museum opens to the public on the 129th anniversary of the battle, welcoming dignitaries from across Africa.	http://localhost:8080/uploads/content-images/65dd7850f37a55b8d6a70d6c64881ccd	3	t	2025-08-27 00:28:57.399984	2025-09-12 12:24:26.318309	የመቶ አመት ታላቅ መክፈቻ	የጦርነቱ 129ኛ ዓመት ክብረ በዓል ሙዚየም ከተለያዩ አፍሪካ የተውጣጡ መሪዎችን ተቀብሎ ለሕዝብ ተከፈተ።
25	2024-03-14	Major Expansion	New wings added including interactive galleries, research center, and state-of-the-art conservation facilities.	http://localhost:8080/uploads/content-images/bcb908875e7e43e362afaead861e395a	4	t	2025-08-27 00:28:57.401712	2025-09-12 12:24:26.319845	ዋና መስፋፋት	በይነተገናኝ ማዕከለ-ስዕላት፣ የምርምር ማዕከል እና ዘመናዊ የጥበቃ ተቋማትን ጨምሮ አዲስ ክንፎች ታክለዋል።
26	2025-05-05	Digital Innovation Era	Launch of virtual tours, digital archive project, and AI-powered interactive experiences for global accessibility.	http://localhost:8080/uploads/content-images/c402d9c5bed54c03be16f8a6bc5e53a9	5	t	2025-08-27 00:28:57.402932	2025-09-12 12:24:26.32117	ዲጂታል ፈጠራ ዘመን	ለአለምአቀፍ ተደራሽነት ምናባዊ ጉብኝቶችን፣ የዲጂታል ማህደር ፕሮጄክትን እና በ AI የተጎላበተ መስተጋብራዊ ተሞክሮዎችን መጀመር።
\.


--
-- Data for Name: mission_vision_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mission_vision_values (id, type, title, description, display_order, is_active, created_at, updated_at, title_am, description_am) FROM stdin;
50701	value	Cultural Bridge	Connecting Ethiopia's rich past with its promising future while fostering global understanding and appreciation.	2	t	2025-08-26 23:44:05.937781	2025-09-12 12:24:26.249662	 የባህል ድልድይ	ዓለም አቀፋዊ ግንዛቤን እና አድናቆትን እያጎለበተ የኢትዮጵያን ባለጸጋ ታሪክ ከወደፊቷ ተስፋ ሰጪ ጋር ማገናኘት።
50704	value	Community Engagement	Building strong partnerships with local communities, schools, and cultural organizations to maximize our impact.	3	t	2025-09-02 19:29:49.989162	2025-09-12 12:24:26.279726	የማህበረሰብ ተሳትፎ	ተጽእኖችንን ከፍ ለማድረግ ከአካባቢው ማህበረሰቦች፣ ትምህርት ቤቶች እና የባህል ድርጅቶች ጋር ጠንካራ አጋርነት መፍጠር።
1	mission	Our Mission	To preserve, interpret, and share the legacy of the Battle of Adwa and Ethiopian heritage through innovative exhibitions, educational programs, and cultural initiatives that inspire pride, unity, and understanding among all visitors while fostering global appreciation for African history and achievements.	0	t	2025-08-24 01:22:22.819349	2025-09-12 12:24:26.12221	 የእኛ ተልዕኮ	የአድዋ ጦርነት እና የኢትዮጵያውያን ቅርሶችን ለመጠበቅ፣ ለመተርጎም እና ለአፍሪካ ታሪክ እና ስኬቶች አለም አቀፋዊ አድናቆትን በሚያጎናጽፉ ፈጠራ ኤግዚቢሽኖች፣ ትምህርታዊ መርሃ ግብሮች እና ባህላዊ ውጥኖች በሁሉም ጎብኝዎች መካከል ኩራትን፣ አንድነትን እና መግባባትን ማካፈል።
2	vision	Our Vision	To be the world's premier institution dedicated to African independence history, serving as a beacon of inspiration for future generations and a bridge connecting Ethiopia's glorious past with its promising future while promoting global understanding of African contributions to world civilization.	0	t	2025-08-24 01:22:22.819349	2025-09-12 12:24:26.154467	የእኛ ራዕይ	ለአፍሪካ የነፃነት ታሪክ የተሠጠ የዓለም ቀዳሚ ተቋም ለመሆን፣ ለመጪው ትውልድ መነሳሳት እና የኢትዮጵያን ታሪካዊ ታሪክ ከመጪው ተስፋ ሰጪ ድልድይ ጋር በማገናኘት አፍሪካን ለዓለም ሥልጣኔ ስላበረከቱት አስተዋፅዖ ዓለም አቀፋዊ ግንዛቤን በማስፋት።
50698	value	Heritage Preservation	Safeguarding Ethiopian cultural treasures for future generations through careful conservation and documentation.	0	t	2025-08-26 18:27:57.060102	2025-09-12 12:24:26.185697	 የቅርስ ጥበቃ	የኢትዮጵያን ባህላዊ ቅርሶች በጥንቃቄ በመጠበቅና በሰነድ በመያዝ ለመጪው ትውልድ መጠበቅ።
50700	value	Educational Excellence	Inspiring learning through innovative exhibitions, interactive experiences, and comprehensive educational programs.	1	t	2025-08-26 18:44:51.258951	2025-09-12 12:24:26.215311	 የትምህርት ልቀት	በፈጠራ ኤግዚቢሽኖች፣ በይነተገናኝ ልምምዶች እና አጠቃላይ ትምህርታዊ ፕሮግራሞች አበረታች ትምህርት።
\.


--
-- Data for Name: museum_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.museum_info (id, setting_key, setting_value, setting_type, description, updated_at, setting_key_am, setting_value_am, description_am) FROM stdin;
6	company_logo	http://localhost:8080/uploads/content-images/acfb619057e5ede0db1a17505834a636	image	Museum Logo	2025-09-12 20:58:10.651735	\N	\N	\N
523	historical_artifacts	5000+	text	Authentic pieces from the Battle of Adwa	2025-09-12 20:58:10.726724	\N	\N	የዓድዋ ጦርነት ትክክለኛ ቁርጥራጮች
525	annual_visitors	50K+	text	From Ethiopia and around the world	2025-09-12 20:58:10.904936	\N	\N	ከኢትዮጵያ እና ከመላው አለም
526	expert_guides	50+	text	Professional historians and cultural experts	2025-09-12 20:58:10.950496	\N	\N	ሙያዊ ታሪክ ተመራማሪዎች እና የባህል ባለሙያዎች
524	interactive_exhibits	12+	text	Immersive displays and multimedia presentations	2025-09-12 20:58:10.983421	\N	\N	መሳጭ ማሳያዎች እና የመልቲሚዲያ አቀራረቦች
1	museum_name	Adwa Victory Memorial	text	Museum Name	2025-09-12 20:58:11.030157	museum_name_am	የዓድዋ  ድል መታሰቢያ	Museum Name
5	opening_hours	Monday-Sunday: 9:00 AM - 6:30 PM	text	Museum opening hours information	2025-09-12 20:58:11.066297	opening_hours_am	ከሰኞ-እሁድ: 9:00 AM - 6:30 PM	Museum opening hours information
3	contact_phone	+251-11-123-4567	text	Museum Phone	2025-09-12 20:58:11.100746	\N	\N	\N
2	contact_email	info@adwamuseum.org	text	Museum Email	2025-09-12 20:58:11.140482	\N	\N	\N
4	address	123 Heritage Street, Addis Ababa, Ethiopia	text	Museum Address	2025-08-26 15:30:22.72704	\N	\N	\N
\.


--
-- Data for Name: page_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.page_content (id, page_name, section_name, title, subtitle, content, background_image, created_at, updated_at, title_am, subtitle_am, content_am) FROM stdin;
3	about	hero	The Adwa Museum stands as Ethiopia's premier historical institution, dedicated to preserving and sharing the remarkable story of the Battle of Adwa.			http://localhost:8080/uploads/content-images/1b37bd42d1af35af0e561a172a7ee580	2025-08-24 01:22:22.819349	2025-09-12 12:24:26.050207	የአድዋ ሙዚየም የአድዋ ጦርነትን አስደናቂ ታሪክ ለመጠበቅ እና ለመካፈል የተቋቋመ የኢትዮጵያ ቀዳሚ ታሪካዊ ተቋም ነው።	\N	\N
4	about	content_section	Our Story		The Adwa Museum stands as Ethiopia's premier historical institution, dedicated to preserving and sharing the remarkable story of the Battle of Adwa - Africa's most significant victory against European colonialism. Founded in 1996 on the centennial of this historic triumph, our museum serves as a beacon of African pride and independence.\r\n\r\nLocated in the heart of Addis Ababa, we house over 10,000 artifacts, documents, and cultural treasures that tell the story of Ethiopian resilience, unity, and the strategic brilliance that made victory possible. Our collections span from ancient Ethiopian civilizations to the modern era, with special focus on the events of March 1, 1896, when Emperor Menelik II's forces achieved what no other African nation could - complete victory over European colonial forces.\r\n\r\nToday, we welcome over 50,000 visitors annually from around the world, serving not just as a museum, but as a living center of learning, cultural exchange, and inspiration for future generations of Africans and global citizens who believe in the power of determination and unity.	\N	2025-08-24 01:22:22.819349	2025-09-12 12:24:26.084696	ታሪካችን	\N	የአድዋ ሙዚየም የኢትዮጵያ ቀዳሚ ታሪካዊ ተቋም ሆኖ የቆመ፣ የአድዋ ጦርነትን አስደናቂ ታሪክ ለመጠበቅ እና ለመካፈል - አፍሪካ በአውሮፓ ቅኝ አገዛዝ ላይ ያስመዘገበችውን ጉልህ ድል። እ.ኤ.አ. በ1996 በዚህ ታሪካዊ ድል መቶኛ አመት የተመሰረተው ሙዚየማችን የአፍሪካ ኩራት እና የነፃነት ምልክት ሆኖ ያገለግላል።\r\n\r\nበአዲስ አበባ እምብርት ላይ የሚገኘውን የኢትዮጵያን ፅናት፣ አንድነት እና ድል ያስቻለውን ስልታዊ ድምቀት የሚተርኩ ከ10,000 በላይ ቅርሶችን፣ ሰነዶችን እና የባህል ቅርሶችን ይዘናል። ስብስቦቻችን ከጥንታዊ የኢትዮጵያ ስልጣኔዎች ጀምሮ እስከ ዘመናዊው ዘመን ድረስ ያተኮሩ ሲሆን በተለይም በመጋቢት 1 ቀን 1896 የዳግማዊ አፄ ምኒልክ ጦር ማንም የአፍሪካ ሀገር ሊያደርገው የማይችለውን ነገር ባሳካበት ወቅት በነበሩት ሁነቶች ላይ - በአውሮፓ ቅኝ ገዥ ሃይሎች ላይ ፍጹም ድል።\r\n\r\nዛሬ በዓለም ዙሪያ በየዓመቱ ከ50,000 በላይ ጎብኝዎችን እንቀበላቸዋለን ፣ እንደ ሙዚየም ብቻ ሳይሆን ፣የመማር ፣የባህል ልውውጥ እና የወደፊት የአፍሪካ ትውልዶች እና የአለም አቀፍ ዜጎች በቆራጥነት እና በአንድነት ሃይል ለሚያምኑ ዜጎች መነሳሳት ነው።
1	home	hero	Adwa Victory Memorial	Discover the Wonders of		http://localhost:8080/uploads/content-images/7bb2d31a7abaf3a6442bda586677d841	2025-08-24 01:22:22.819349	2025-09-12 21:50:24.998306	የዓድዋ  ድል መታሰቢያ	የአድዋ ድንቆችን  ይጎብኙ	
2	home	about_section	A Living Testament to Ethiopian Glory		Step into the Adwa Museum and embark on an extraordinary journey through one of Africa's most significant historical moments. Our museum stands as a beacon of Ethiopian pride, commemorating the decisive victory at the Battle of Adwa in 1896 that secured Ethiopia's sovereignty and inspired liberation movements across the continent.\r\n\r\nThrough cutting-edge technology, authentic artifacts, and immersive storytelling, we bring to life the courage, strategy, and unity that defined this pivotal moment in world history. Our exhibitions showcase not just a military victory, but a triumph of African resistance against colonialism that resonated globally.\r\n\r\nBeyond our historical exhibitions, the Adwa Museum serves as a vibrant cultural center, hosting educational programs, research initiatives, and community events that connect past achievements with present aspirations and future possibilities.	\N	2025-08-24 01:22:22.819349	2025-09-12 21:50:25.03329	የኢትዮጵያ ክብር ሕያው ምስክር		ወደ አድዋ ሙዚየም ይግቡ እና በአፍሪካ ትልቅ ጉልህ ስፍራ ካላቸው ታሪካዊ ወቅቶች ውስጥ አንዱ በሆነው ያልተለመደ ጉዞ ይጀምሩ። ሙዚየማችን በ1896 የኢትዮጵያን ሉዓላዊነት ያረጋገጠ እና በአህጉሪቱ የነጻነት ንቅናቄዎችን ያነሳሳውን የአድዋ ጦርነት ወሳኙን ድል በማሰብ የኢትዮጵያውያን ኩራት መገለጫ ሆኖ ቆሟል።\r\n\r\nበቴክኖሎጂ፣ በእውነተኛ ቅርሶች፣ እና መሳጭ ታሪኮች አማካኝነት፣ ይህንን በአለም ታሪክ ውስጥ ወሳኝ ጊዜን የሚገልጽ ድፍረትን፣ ስልት እና አንድነትን ወደ ህይወት እናመጣለን። የእኛ ኤግዚቢሽኖች ወታደራዊ ድልን ብቻ ሳይሆን የአፍሪካን ቅኝ አገዛዝ በመቃወም በዓለም አቀፍ ደረጃ ያስተጋባውን ድል ያሳያሉ።\r\n\r\nከታሪካዊ ኤግዚቢሽኖቻችን ባሻገር፣ የአድዋ ሙዚየም እንደ ደማቅ የባህል ማዕከል ሆኖ ያገለግላል፣ ትምህርታዊ ፕሮግራሞችን፣ የምርምር ውጥኖችን እና የማህበረሰብ ዝግጅቶችን በማስተናገድ ያለፉ ስኬቶችን ከአሁኑ ምኞት እና የወደፊት እድሎች ጋር የሚያገናኙ።
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partners (id, name, logo_url, website_url, description, display_order, is_active, created_at, updated_at, name_am) FROM stdin;
30	Ethio tele	http://localhost:8080/uploads/content-images/7f4b63009cb30db58defed1826f20bd5			0	t	2025-08-26 17:08:10.4082	2025-09-12 20:58:11.312838	ኢትዮ ቴሌ
32	Telebirr	http://localhost:8080/uploads/content-images/c9ebaef2498c32594b8980434a35d565			1	t	2025-08-26 17:13:42.682987	2025-09-12 20:58:11.351551	ቴሌ ብር
33	Tourism	http://localhost:8080/uploads/content-images/bab42eaf8dd2d95989eb63444564fd7d			2	t	2025-08-27 15:39:45.639413	2025-09-12 20:58:11.386473	ቱሪዝም
34	ITDB	http://localhost:8080/uploads/content-images/27b174be6407c09577a437b1abeef4d7			3	t	2025-08-27 15:39:45.64527	2025-09-12 20:58:11.422563	አይቲዲቢ
35	CBE	\N			4	t	2025-08-27 15:39:45.651241	2025-09-12 20:58:11.459495	ንግድ ባንክ
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, user_id, token, expires_at, created_at) FROM stdin;
1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjEsImVtYWlsIjoibHVoZW5hYWJlYmVAZ21haWwuY29tIiwiaWF0IjoxNzU2NzYxMDA0LCJleHAiOjE3NTY3NjQ2MDR9.gX6CrWtCwQGrGxk0_huskRQgqtuOWWUTDeaQHcU4nXU	2025-09-02 01:10:04.721	2025-09-02 00:10:04.723003
2	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImVtYWlsIjoibHl0c21hbjU2QGdtYWlsLmNvbSIsImlhdCI6MTc1Njg5MTkwMywiZXhwIjoxNzU2ODk1NTAzfQ.9qxtmfddWsU5wtn_jFu7aavXmXL0re57rVMKCYH7QMA	2025-09-03 13:31:43.586	2025-09-03 12:31:43.587957
3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUsImVtYWlsIjoibHl0c21hbjU2QGdtYWlsLmNvbSIsImlhdCI6MTc1Njg5MjEzNiwiZXhwIjoxNzU2ODk1NzM2fQ.sy1p3_FCUsiNtQW9qu3MDVpLpnMNZ_U-sOxhUHaYmaI	2025-09-03 13:35:36.701	2025-09-03 12:35:36.703119
4	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsImVtYWlsIjoibHVoZW5hYWJlYmUwODZAZ21haWwuY29tIiwiaWF0IjoxNzU3MTY3MjU2LCJleHAiOjE3NTcxNzA4NTZ9.GDSXgtcPxUM7uH5SW1nR5L_iYKxq8IAqzsv5Ody2ZIE	2025-09-06 18:00:56.791	2025-09-06 17:00:56.797014
5	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTIwNDMsImV4cCI6MTc1NzI1NTY0M30.1noGnl3KYZYOUJb7c6Jz7Bp680kPoCfVNxirEP9Pcww	2025-09-07 17:34:03.653	2025-09-07 16:34:03.655089
6	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTc0MTI3ODEsImV4cCI6MTc1NzQxNjM4MX0.aUTCQSwneNrIPXauHID_N2l9rUPcCCjyTIEIvL_h71I	2025-09-09 14:13:01.11	2025-09-09 13:13:01.111231
7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImVtYWlsIjoibHl0c21hbjU2QGdtYWlsLmNvbSIsImlhdCI6MTc1NzU0ODg2OSwiZXhwIjoxNzU3NTUyNDY5fQ.WL-brfhetZLPBYlnGqtw8NhXtzPyur4t_5e1p5LVZ80	2025-09-11 04:01:09.268	2025-09-11 03:01:09.2702
8	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImVtYWlsIjoibHl0c21hbjU2QGdtYWlsLmNvbSIsImlhdCI6MTc1NzU0ODg4NSwiZXhwIjoxNzU3NTUyNDg1fQ.Bz9YPLIOBUDxsQSa6T6FSA50gEYd5dIxDR6yE5qfnxQ	2025-09-11 04:01:25.347	2025-09-11 03:01:25.348147
9	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsImVtYWlsIjoibHVoZW5hYWJlYmUwODZAZ21haWwuY29tIiwiaWF0IjoxNzU3NTQ5Mzc5LCJleHAiOjE3NTc1NTI5Nzl9.MAXmi3cQ0psOYva1IPpUFotIlCI9FGIBy-oICBUf9UY	2025-09-11 04:09:39.607	2025-09-11 03:09:39.608957
10	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTQsImVtYWlsIjoibHVoZW5hYWJlYmUwODZAZ21haWwuY29tIiwiaWF0IjoxNzU3Nzk3MDYwLCJleHAiOjE3NTc4MDA2NjB9.Tfz2Ciz-rOss-oBRpBdOIGrE7hgUJxRkefgy6hXhyns	2025-09-14 00:57:40.935	2025-09-13 23:57:40.937001
\.


--
-- Data for Name: pending_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_payments (tx_ref, meta, created_at) FROM stdin;
7588a365-0129-4dcc-bdcd-2e4132d5bd4d	{"visit_date":"2025-08-15","ticketTypes":[{"ticket_id":"2","quantity":2},{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 00:01:14.603828
8216fc64-c57b-4ebc-bc2d-39b0376976d5	{"visit_date":"2025-08-15","ticketTypes":[{"ticket_id":"2","quantity":2},{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 00:04:44.359419
d08dcbcc-719f-4a23-8d23-a9d501a95771	{"visit_date":"2025-08-15","ticketTypes":[{"ticket_id":"2","quantity":2},{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 00:06:12.408864
fd596845-bac6-42c2-8ada-668a78a682a4	{"visit_date":"2025-08-14T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 02:21:38.798542
5ff1c1ee-369e-49b3-a9a9-ad9e39aeff88	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 17:54:39.773018
7cadffee-29bf-4da2-8f59-8477d63063a9	{"visit_date":"2025-08-06T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 17:58:02.863959
c02e8622-e0a1-4477-ba13-4a622e52747e	{"visit_date":"2025-08-21T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 18:00:44.547703
4930331e-6d5d-40c7-b32e-96529c5e7091	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:03:12.228052
7b6d9275-1221-47cc-9dad-6eb183d57a13	{"visit_date":"2025-08-08T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":2},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:13:07.518471
7e8ddd15-e9ae-46cb-bf68-6cab3063f655	{"visit_date":"2025-08-06T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:23:45.96948
86cdc3a9-b24c-4315-b816-52e61d5d3820	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:34:52.791729
0eb8cc2a-3cdd-48a9-9522-afad2331f7a7	{"visit_date":"2025-08-05T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"3","quantity":1},{"ticket_id":"4","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:47:41.77974
4158bd58-0687-48b4-9ea5-d5daed64b919	{"visit_date":"2025-08-06T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:53:44.936547
b7767d2d-f739-48ac-b698-6f02cd3346b9	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 19:55:08.442425
52ce9fe2-8c82-4b9e-b84f-b0377d700f01	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"3","quantity":1},{"ticket_id":"4","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 20:16:16.410964
7bd2e149-ff27-4562-a3c8-b4f0fa44d95c	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1},{"ticket_id":"2","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 20:18:20.095742
284d26cb-eadb-4034-bb5b-14e2005b0198	{"visit_date":"2025-08-06T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 21:37:18.373467
ef9be789-779b-429d-b04f-fbc488bdd3b9	{"visit_date":"2025-08-07T21:00:00.000Z","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-04 21:39:21.037127
daa123ea-f7a2-4bfb-a14a-fed3537d238f	{"visit_date":"2026-02-03T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":6}],"isGroup":false,"services":[]}	2025-08-05 12:27:36.297854
9b02e1cc-264e-4a2d-850a-687810ed6f35	{"visit_date":"2027-02-09T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":3}],"isGroup":false,"services":[]}	2025-08-05 12:28:23.311512
2a9571c3-e1d8-469a-ac1d-d4f0d3336b71	{"visit_date":"2027-03-04T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":2}],"isGroup":false,"services":[]}	2025-08-05 12:36:52.710506
a7ce9bfc-e2b2-436e-b78b-c2fdba77deae	{"visit_date":"2025-08-05T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":2}],"isGroup":false,"services":[]}	2025-08-05 14:35:36.772
e70566b1-83b2-4919-912a-4f39e9956116	{"visit_date":"2026-02-04T21:00:00.000Z","ticketTypes":[{"ticket_id":"2","quantity":2}],"isGroup":false,"services":[]}	2025-08-05 14:43:33.103713
7bd0a569-a368-445a-b589-08dc3c22c2ea	{"visit_date":"8/5/2025","ticketTypes":[{"ticket_id":"4","quantity":1}],"isGroup":false,"services":[]}	2025-08-05 20:31:56.937595
81acb6c2-3721-4e98-b08e-9f0eb44715c2	{"visit_date":"8/7/2025","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-05 22:22:56.495973
ab4c5eab-bb02-413b-8cb1-e24f3c1882fe	{"visit_date":"8/5/2025","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-05 22:37:14.277686
612e2369-4b53-4c58-99f2-c7ce93a61bb7	{"visit_date":"8/7/2025","ticketTypes":[{"ticket_id":"1","quantity":1}],"isGroup":false,"services":[]}	2025-08-05 22:38:38.667186
cb5a8e44-702b-4b41-a588-6dcad402304b	{"visit_date":"8/7/2025","ticketTypes":[{"ticket_id":"4","quantity":1}],"isGroup":false,"services":[]}	2025-08-06 00:06:33.084078
f9b6c250-7e7b-49eb-bbe0-6b8b48a22809	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":2}],"totalTickets":2,"totalAmount":1000}	2025-08-19 16:25:27.487012
8a6f7c16-0c63-4a43-a95f-3e5e466b3a38	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":2}],"totalTickets":2,"totalAmount":1000}	2025-08-19 16:28:13.297665
8be8b75b-ccac-4797-865f-8986bbb534f0	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":4}],"totalTickets":4,"totalAmount":2000}	2025-08-19 16:30:02.82501
bc8e149d-d174-466b-a92f-cc995d385c39	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":2}],"totalTickets":2,"totalAmount":1000}	2025-08-19 16:30:33.277206
13bf1260-1c4b-4cbe-8341-10191b1b3b9b	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":7}],"totalTickets":7,"totalAmount":3500}	2025-08-19 16:34:04.665659
e25ecfba-06a7-4525-b45c-a4de01c00080	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":65,"quantity":2}],"totalTickets":2,"totalAmount":1000}	2025-08-19 16:46:17.009437
324416b6-c031-492e-9c7b-b9634948a4e0	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":82,"quantity":1},{"ticket_id":83,"quantity":1},{"ticket_id":84,"quantity":1},{"ticket_id":85,"quantity":1}],"totalTickets":4,"totalAmount":989}	2025-08-19 22:12:29.149184
a7fcde1c-80b5-4fd8-a83f-70daf0956276	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":82,"quantity":1},{"ticket_id":83,"quantity":1}],"totalTickets":2,"totalAmount":445}	2025-08-19 22:16:06.586523
2011b4b5-60fe-41b2-a31d-bcc2c9b07704	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":82,"quantity":1},{"ticket_id":83,"quantity":1}],"totalTickets":2,"totalAmount":445}	2025-08-19 22:19:02.722136
c6b90e67-7d20-43a6-b206-a50026a31182	{"event_id":42,"email":"adwa@adwavictory.com","full_name":"Walk-in Guest","phone_no":"0000000000","ticketTypes":[{"ticket_id":82,"quantity":1},{"ticket_id":83,"quantity":1},{"ticket_id":84,"quantity":1}],"totalTickets":3,"totalAmount":489}	2025-08-19 22:21:42.744162
f52fcd6d-0c67-443c-a57e-86c06439dbc7	{"visit_date":"8/30/2025","ticketTypes":[{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-08-21 20:54:22.831684
8560aedd-08cf-4004-80ec-26bf9ad62b17	{"event_id":48,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":128,"quantity":1}],"totalTickets":1,"totalAmount":100}	2025-08-22 02:25:56.735074
37eee5df-90b1-4205-99fc-01df503cdfc5	{"event_id":48,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":128,"quantity":1}],"totalTickets":1,"totalAmount":100}	2025-08-22 02:26:26.142563
731f9d82-bf14-4884-bedc-ef55da178582	{"event_id":48,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"+251944357340","ticketTypes":[{"ticket_id":128,"quantity":1}],"totalTickets":1,"totalAmount":100}	2025-08-22 02:26:46.395237
0d804c4e-af50-44ef-a711-390dc2641b22	{"event_id":48,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":128,"quantity":1}],"totalTickets":1,"totalAmount":100}	2025-08-22 02:26:59.010192
58dd4cd1-16bd-4c3e-9bba-0ee66be1e6af	{"event_id":48,"email":"admin@venue.com","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":122,"quantity":1}],"totalTickets":1,"totalAmount":200}	2025-08-22 02:28:17.500179
b5a311dd-a06a-4a7d-a8ea-dcf3f44af498	{"event_id":53,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":97,"quantity":1},{"ticket_id":98,"quantity":1}],"totalTickets":2,"totalAmount":750}	2025-08-22 02:37:39.706385
00fb0fcc-f81a-407b-ac4c-d2fe1a75a36d	{"event_id":53,"email":"demo@adwamuseum.et","full_name":"lyts","phone_no":"0944357340","ticketTypes":[{"ticket_id":97,"quantity":1},{"ticket_id":98,"quantity":1}],"totalTickets":2,"totalAmount":750}	2025-08-22 02:38:47.212725
26d94295-a639-4da9-b5af-e9b1b8a64ed9	{"visit_date":"Invalid Date","ticketTypes":[{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-09-07 12:23:43.204843
810fa6d7-73c2-4698-afd8-3728193f1adb	{"visit_date":"Invalid Date","ticketTypes":[{"ticket_id":"3","quantity":1}],"isGroup":false,"services":[]}	2025-09-07 12:24:22.323967
12a06bdd-1e40-47b0-8613-e255c9ec44ed	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"13","quantity":2,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":13,"quantity":2,"base_unit_price":300,"discount_percent_applied":0,"discounted_unit_price":"300","base_line_total":600,"line_discount_amount":0,"final_line_total":600,"currency":"USD"}]}	2025-09-07 15:59:09.473859
7ec898a0-af14-44b5-8e12-1c34f1ac9e64	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"13","quantity":2,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":13,"quantity":2,"base_unit_price":300,"discount_percent_applied":0,"discounted_unit_price":"300","base_line_total":600,"line_discount_amount":0,"final_line_total":600,"currency":"USD"}]}	2025-09-07 16:00:04.514504
466a3958-b633-4b67-85b5-6e8cd6d9030a	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:06:31.083651
e0897b19-983b-46da-8476-46e599bc3888	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:07:26.919825
c5d1e1c3-8af2-419d-9b56-ef769d9386d4	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:11:41.112798
77d49542-dcf1-4c0e-8421-76c6e9c74877	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:13:31.338081
27136cf5-aa73-40e2-8856-2490e13eaa03	{"visit_date":"9/18/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:18:52.682806
e98e5d33-c21e-498b-81f2-d2dbdc9ed78d	{"visit_date":"9/18/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:23:57.183954
e457a936-1e49-44a8-9180-f3873a905ba8	{"visit_date":"9/18/2025","ticketTypes":[{"ticket_id":"2","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":2,"quantity":1,"base_unit_price":500,"discount_percent_applied":0,"discounted_unit_price":"500.00","base_line_total":500,"line_discount_amount":0,"final_line_total":500,"currency":"ETB"}]}	2025-09-07 16:24:39.949477
c59756a5-cf82-486d-bf00-051fa6f01e43	{"visit_date":"9/25/2025","ticketTypes":[{"ticket_id":"6","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":6,"quantity":1,"base_unit_price":600,"discount_percent_applied":0,"discounted_unit_price":"600","base_line_total":600,"line_discount_amount":0,"final_line_total":600,"currency":"ETB"}]}	2025-09-07 16:25:31.728889
486b0514-1297-4489-b883-41630301a397	{"visit_date":"9/24/2025","ticketTypes":[{"ticket_id":"13","quantity":1,"unit_price":null,"discount_percent":0}],"isGroup":false,"services":[],"discount_breakdown":[{"ticket_id":13,"quantity":1,"base_unit_price":300,"discount_percent_applied":0,"discounted_unit_price":"300","base_line_total":300,"line_discount_amount":0,"final_line_total":300,"currency":"USD"}]}	2025-09-07 16:27:22.338207
\.


--
-- Data for Name: pending_payments_staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_payments_staff (tx_ref, email, visit_date, ticket_info, amount, currency, status, created_at) FROM stdin;
tx-adwamuseum-c5829efb-124e-4acb-8711-7c0bb9316229	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	pending	2025-07-31 17:48:29.064342
tx-adwamuseum-c909dadf-80f9-46a5-904c-a10760cd8c24	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 17:54:31.667863
tx-adwamuseum-66aa0224-e65b-4a6e-81a1-c302b03ec4b5	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 18:01:50.056808
tx-adwamuseum-bdfcda6a-9822-482b-9ff1-273617fbcbee	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 18:02:56.732411
tx-adwamuseum-c38424e1-63af-46ad-85cb-362b90ca16d3	adwavictory232@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 18:04:58.852439
tx-adwamuseum-7fd91c62-33af-44bb-a9a2-80772ac49a2f	adwavictory@adwa.com	2025-08-09	[{"type":"tourist","quantity":1},{"type":"student","quantity":1},{"type":"premium","quantity":1}]	900.00	ETB	paid	2025-07-31 20:10:32.899497
tx-adwamuseum-84fc643d-53ae-4235-9914-84760570dcbd	adwavictory@adwa.com	2025-08-07	[{"type":"tourist","quantity":1},{"type":"student","quantity":1},{"type":"premium","quantity":1}]	900.00	ETB	paid	2025-07-31 20:16:04.055705
tx-adwamuseum-f2478e82-ebb4-438f-a181-95947a12f482	adwavictory@adwa.com	2025-08-08	[{"type":"tourist","quantity":1},{"type":"student","quantity":1},{"type":"premium","quantity":1}]	900.00	ETB	paid	2025-07-31 20:18:19.402206
tx-adwamuseum-7b801dea-1b72-4e42-aab0-b496c7064bdb	adwavictory@adwa.com	2025-08-08	[{"type":"tourist","quantity":1},{"type":"student","quantity":1},{"type":"premium","quantity":1}]	900.00	ETB	paid	2025-07-31 20:24:29.04909
tx-adwamuseum-03053083-ab37-4165-8914-5995bf38d036	adwavictory@adwa.com	2025-08-15	[{"type":"tourist","quantity":1},{"type":"student","quantity":1}]	400.00	ETB	paid	2025-07-31 21:04:46.853522
tx-adwamuseum-5a6848eb-6f35-42ba-95c9-975957df62ac	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 21:49:21.530585
tx-adwamuseum-1ef375b6-74c3-4915-b721-fe8e2aa7a0fb	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":5},{"type":"VIP","quantity":1}]	2000.00	ETB	paid	2025-07-31 21:50:20.037593
tx-adwamuseum-81038fbf-53ce-496d-85fe-7653cbb34e85	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":5},{"type":"VIP","quantity":1}]	2000.00	ETB	pending	2025-07-31 22:00:52.947137
tx-adwamuseum-6d3b1257-841e-4edf-a5a8-98c851dc973a	adwavictory232@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 22:10:44.017571
tx-adwamuseum-a77a8673-4733-4bb2-9180-bf1f15b68212	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 22:11:12.70838
tx-adwamuseum-56342617-bc9c-46b5-b88f-cfb856548e0e	adwavictory@adwa.com	2025-07-31	[{"type":"Standard","quantity":2},{"type":"VIP","quantity":1}]	1100.00	ETB	paid	2025-07-31 22:11:35.099469
tx-adwamuseum-91c3c5d7-c9a3-4507-bb2d-94cf5815794d	adwa@adwavictory.com	2025-08-05	[{"type":"Standard","quantity":3}]	900.00	ETB	pending	2025-08-05 13:33:32.495564
tx-adwamuseum-ff5819cc-fbc5-4bad-a279-0ea09c096ef5	adwa@adwavictory.com	2025-08-02	[{"type":"Standard","quantity":100},{"type":"VIP","quantity":20},{"type":"premium","quantity":100},{"type":"student","quantity":200},{"type":"tourist","quantity":300}]	200000.00	ETB	pending	2025-08-02 03:31:23.341123
tx-adwamuseum-8e1cca16-0b29-4522-8349-e6bc3d11bbe0	adwa@adwavictory.com	2025-08-05	[{"type":"VVIP","quantity":5}]	3000.00	ETB	pending	2025-08-05 18:32:32.798258
tx-adwamuseum-eed360ea-c719-4797-b66e-c6ec56c66385	adwa@adwavictory.com	2025-09-16	[{"type":"VIP","quantity":1},{"type":"tourist","quantity":1}]	43664.11	ETB	pending	2025-09-15 22:47:05.502948
\.


--
-- Data for Name: pending_table_service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_table_service (id, request_id, email, tx_ref, amount, currency, created_at) FROM stdin;
42	101	luhenaabebe086@gmail.com	tx-adwamuseum-bdfe5e95-e0e5-440d-813b-b8a475ea4170	14400.00	ETB	2025-09-06 22:38:32.424005
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (permission_id, name, title, url, icon, section) FROM stdin;
5	STAFF_MGMT	Staff Management	/portal/manage-users	Users	[USER_MANAGEMENT]
6	ROLE_MGMT	Role Management	/portal/manage-roles	Shield	[USER_MANAGEMENT]
7	ACTIVITY_LOGS	Activity Logs	/portal/logs	FileText	[USER_MANAGEMENT]
8	SYS_CONFIG	Settings	/portal/settings	Settings	[SYSTEM_CONFIG]
18	DPT				
16	EVT_SCHED			\N	\N
17	VENUE_MGMT	\N	\N	\N	\N
22	EVT_CATEGORY	\N	\N	\N	\N
23	SVC_CATEGORY	\N	\N	\N	\N
27	VISITOR	Visitors	/portal/visitors	Users	[USER_MANAGEMENT]
28	FEEDBACK	Feedback	/portal/feedback	MessageSquare	[USER_MANAGEMENT]
2	WALKIN_REG	Walk-In Registration	/portal/ticket-management/walk-in-registration	UserPlus	[TICKET_MANAGEMENT]
3	VALIDATE_TCKT	Validate Ticket	/portal/ticket-management/ticket-validation	TicketCheck	[TICKET_MANAGEMENT]
9	TCKT_DASHBOARD	Dashboard	/portal/ticket-management/ticket-dashboard	LayoutDashboard	[TICKET_MANAGEMENT]
10	TSCHED_MGMT	Schedule	/portal/ticket-management/ticket-schedule	CalendarDays	[TICKET_MANAGEMENT]
11	TCKT_TYPES	Ticket Types	/portal/ticket-management/ticket-types	Ticket	[TICKET_MANAGEMENT]
12	EVT_CRUD	Create Event	/portal/events	CalendarPlus	[EVENT_MANAGEMENT]
13	EVT_REPORT	Event Report	/portal/event-report	FileBarChart	[EVENT_MANAGEMENT]
14	EVT_VAL	Validate Ticket	/portal/event-management/event-validation	TicketCheck	[EVENT_MANAGEMENT]
15	EVT_WALKIN	Walk-in Registration	/portal/event-management/event-walkin	UserPlus	[EVENT_MANAGEMENT]
19	CMS	Content Managment	/portal/content-management	FileText	[CONTENT_MANAGEMENT]
20	SVC_MGMT	Create Service	/portal/facilities	PlusCircle	[SERVICE_MANAGEMENT]
21	SVC_REQUEST	Manage Request	/portal/service-requests	Inbox	[SERVICE_MANAGEMENT]
24	SVC_REPORT	Service Report	/portal/service-reports	BarChart3	[SERVICE_MANAGEMENT]
25	AD	Advertisment	/portal/advertisements	Megaphone	[Marketing]
26	DISCOUNT	Group Discount	/portal/groupDiscount	Users	[TICKET_MANAGEMENT]
\.


--
-- Data for Name: question_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_options (id, question_id, value, label, metadata, ordinal, created_at) FROM stdin;
1	2	battle_diorama	Battle of Adwa Diorama	{}	1	2025-09-12 17:52:43.0635+03
2	2	historical_artifacts	Historical Artifacts	{}	2	2025-09-12 17:52:43.0635+03
3	2	multimedia_presentation	Multimedia Presentation	{}	3	2025-09-12 17:52:43.0635+03
4	2	cultural_exhibit	Cultural Heritage Exhibit	{}	4	2025-09-12 17:52:43.0635+03
5	2	art_gallery	Art Gallery	{}	5	2025-09-12 17:52:43.0635+03
6	5	word_of_mouth	Word of Mouth	{}	1	2025-09-12 17:52:43.0635+03
7	5	social_media	Social Media	{}	2	2025-09-12 17:52:43.0635+03
8	5	travel_guide	Travel Guide	{}	3	2025-09-12 17:52:43.0635+03
9	5	hotel_recommendation	Hotel Recommendation	{}	4	2025-09-12 17:52:43.0635+03
10	5	walk_in	Walk-in Visitor	{}	5	2025-09-12 17:52:43.0635+03
11	7	battle_diorama	የአድዋ ጦርነት ሞዴል	{}	1	2025-09-12 17:52:43.0635+03
12	7	historical_artifacts	ታሪካዊ አቀማመጦች	{}	2	2025-09-12 17:52:43.0635+03
13	7	multimedia_presentation	ማለቂያ የሌለው ማሳያ	{}	3	2025-09-12 17:52:43.0635+03
14	7	cultural_exhibit	ባህላዊ ቅርሶች	{}	4	2025-09-12 17:52:43.0635+03
15	7	art_gallery	የጥበብ ማሳያ	{}	5	2025-09-12 17:52:43.0635+03
16	10	word_of_mouth	ከጓደኛዎች	{}	1	2025-09-12 17:52:43.0635+03
17	10	social_media	ማህበራዊ ሚዲያ	{}	2	2025-09-12 17:52:43.0635+03
18	10	travel_guide	የጉዞ መመሪያ	{}	3	2025-09-12 17:52:43.0635+03
19	10	hotel_recommendation	ከሆቴል	{}	4	2025-09-12 17:52:43.0635+03
20	10	walk_in	በእግር ጉዞ	{}	5	2025-09-12 17:52:43.0635+03
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
181	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0NDI5MjMzLCJleHAiOjE3NTUwMzQwMzN9._cdHeaGfqtYu0oFbk7XTKLAPQ93xAejxqSJM5p_KnNU	2025-08-13 00:27:13.054163	2025-08-06 01:50:45.89521
182	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkxOTMsImV4cCI6MTc1NTA0Mzk5M30.UdPaJ1Emr1Tyw9VJIGPZyER4W3SO5VoTcAmbrTzKt40	2025-08-13 03:13:13	2025-08-06 03:13:13.071932
183	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkyMDMsImV4cCI6MTc1NTA0NDAwM30.P3VvDgwt3sUcHhPqPHPRpGKxSlXg7g4p75VMmHLxJuU	2025-08-13 03:13:23	2025-08-06 03:13:23.579406
184	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkyNTAsImV4cCI6MTc1NTA0NDA1MH0.UGu5qNitDXK6TSeX0Xoi9dy3bkI5FTRdhvJROIgRBSk	2025-08-13 03:14:10	2025-08-06 03:14:10.775137
185	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkyNTIsImV4cCI6MTc1NTA0NDA1Mn0.hO1uWLrTAAa2mKprFvujUExekH6NyK8maOfW0TFM48g	2025-08-13 03:14:12	2025-08-06 03:14:12.696571
186	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkyOTMsImV4cCI6MTc1NTA0NDA5M30.AWFQkx0-r0BEll7-vHucE4vXGkDdCiw_u05Kw168V0U	2025-08-13 03:14:53	2025-08-06 03:14:53.865491
103	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzNzUyNjI0LCJleHAiOjE3NTQzNTc0MjR9.DNGeFE2sWL3kWc4MMpkFaqH71-e_Pv-tLBs9cVJxYDQ	2025-08-05 04:30:24.73391	2025-08-06 01:50:45.89521
105	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzNzUzOTk3LCJleHAiOjE3NTQzNTg3OTd9.bm37dvDMaegCFhVAblMErXB89tAjJIZLAABCyQ08-wA	2025-08-05 04:53:17.1119	2025-08-06 01:50:45.89521
108	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzNzc5MTA3LCJleHAiOjE3NTQzODM5MDd9.u5RquAAdbbgWvzDAZsDm3efPC4_qic5j469CuKYISGI	2025-08-05 11:51:47.350932	2025-08-06 01:50:45.89521
113	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzNzg2MzE0LCJleHAiOjE3NTQzOTExMTR9.YWV4RObREVSB2AFpmOaSbVLizuS-pROpEVdmw0JcXR0	2025-08-05 13:51:54.058676	2025-08-06 01:50:45.89521
115	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4Nzk4NCwiZXhwIjoxNzU0MzkyNzg0fQ.SyevyqcnqGIUSRHMgrJtdfhhpVaIkScc-aizzLhqBCw	2025-08-05 14:19:44.599668	2025-08-06 01:50:45.89521
116	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4Nzk4NiwiZXhwIjoxNzU0MzkyNzg2fQ.joPBwSWPx6VSpOeopZIbD_p0WzKKPKi3NU_xm2gGCng	2025-08-05 14:19:46.330423	2025-08-06 01:50:45.89521
117	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4Nzk4OCwiZXhwIjoxNzU0MzkyNzg4fQ.3-ptFhTuMBB2ERgSdL0zyegGjX5lafreTwBxJuorrEk	2025-08-05 14:19:48.905001	2025-08-06 01:50:45.89521
118	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4Nzk4OSwiZXhwIjoxNzU0MzkyNzg5fQ.mQ7BRBG6SBPkURn_vrWslaieqdi0RbIQLIH4U5cz7uw	2025-08-05 14:19:49.652604	2025-08-06 01:50:45.89521
119	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4Nzk5MCwiZXhwIjoxNzU0MzkyNzkwfQ.ClTt-kn4ZY2gorke5BFeLv7MDrpXrLslGa6JTRm3ghs	2025-08-05 14:19:50.241652	2025-08-06 01:50:45.89521
121	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsImlhdCI6MTc1Mzc4ODIxNCwiZXhwIjoxNzU0MzkzMDE0fQ.E5u3RteevQDClRMjxVOYZjomyIBrJ7Ji5GhbmHVIAVY	2025-08-05 14:23:34.548359	2025-08-06 01:50:45.89521
123	21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImlhdCI6MTc1Mzc4ODc3MywiZXhwIjoxNzU0MzkzNTczfQ.65SS76thiqyITbAvrBJInMNwA6f3lGbB9Z7VF_VR2Mc	2025-08-05 14:32:53.477083	2025-08-06 01:50:45.89521
129	25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUsImlhdCI6MTc1Mzc5OTE3MiwiZXhwIjoxNzU0NDAzOTcyfQ.BZP9OshOuV1ngNip3HYZ7iMqCwy536hYbXG8jyfkuqk	2025-08-05 17:26:12.197714	2025-08-06 01:50:45.89521
132	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzODA2MjM3LCJleHAiOjE3NTQ0MTEwMzd9.zfCLMay6HcTzJ_ioa-v3gxxPmxcs_bv_gHyFhfGfGuQ	2025-08-05 19:23:57.283819	2025-08-06 01:50:45.89521
138	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzUzODIyNTcwLCJleHAiOjE3NTQ0MjczNzB9.LKw8tNwbgGpFvLusRAmS5HzxuJFdw4g7YKXUtixeV7k	2025-08-05 23:56:10.425441	2025-08-06 01:50:45.89521
144	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MDQ4OTgxLCJleHAiOjE3NTQ2NTM3ODF9.bpxR0S8a5zbE-jKH5Y-5e-_vIzOcMLmSzDeMb0XrEkI	2025-08-08 14:49:41.644353	2025-08-06 01:50:45.89521
145	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MDU0MDM4LCJleHAiOjE3NTQ2NTg4Mzh9._bbsH3fz85kN3-86f-BhAPeU2NNuoGTC2XgLzlV3DKc	2025-08-08 16:13:58.342224	2025-08-06 01:50:45.89521
146	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MDkyODM1LCJleHAiOjE3NTQ2OTc2MzV9.D6rESNQo_AYlo1bQS6F447bLKQW1xtgWlECTjQ46uE0	2025-08-09 03:00:35.230863	2025-08-06 01:50:45.89521
148	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTI2OTg3LCJleHAiOjE3NTQ3MzE3ODd9.yYV1mmU6Cazhf9l39vxTIxqnOZObS_5GMhg6sN_lAew	2025-08-09 12:29:47.990934	2025-08-06 01:50:45.89521
149	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTU2ODIyLCJleHAiOjE3NTQ3NjE2MjJ9.pnFMQjmjnefiHFFBeiyK_fQ4XBWSya6g9Zwn_rqNp3A	2025-08-09 20:47:02.840523	2025-08-06 01:50:45.89521
150	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTU2ODMyLCJleHAiOjE3NTQ3NjE2MzJ9.8xC9kvjCR1I4TVdT4BU3CUFhyDWVFoxhACgM6mYyYFc	2025-08-09 20:47:12.369685	2025-08-06 01:50:45.89521
151	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTU2OTQ1LCJleHAiOjE3NTQ3NjE3NDV9.uE_vOEkpxRyvBWF97tkq3GXdbAiVZ2yJNxt1RbN-eTc	2025-08-09 20:49:05.185638	2025-08-06 01:50:45.89521
154	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc1NDE1NzQyNiwiZXhwIjoxNzU0NzYyMjI2fQ.upzpqDg-xQZjC33Oawz2sJJGZZAus7rKaSF-qx-XDto	2025-08-09 20:57:06.905078	2025-08-06 01:50:45.89521
155	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTU5NTkxLCJleHAiOjE3NTQ3NjQzOTF9.RuhVmndeNb0W3J-Dcw_V4l0J7SHZ_RiRcrauKV5RHdQ	2025-08-09 21:33:11.456398	2025-08-06 01:50:45.89521
156	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTU5NzU5LCJleHAiOjE3NTQ3NjQ1NTl9.klrNlZDL3PKUplWr1fdnHrTv3_srUHpQXe_meQEPQjM	2025-08-09 21:35:59.099139	2025-08-06 01:50:45.89521
157	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTYwMTk0LCJleHAiOjE3NTQ3NjQ5OTR9.3T7nFbl4SkGp7Ij85vRFCQrd3pA5Zup3zB1U0lpZ5_0	2025-08-09 21:43:14.260921	2025-08-06 01:50:45.89521
160	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTYyMzUzLCJleHAiOjE3NTQ3NjcxNTN9.Xt17YPHiHaxVKD7m45V2nuaThq4hFk_kKHwn_VcM9Sc	2025-08-09 22:19:13.118925	2025-08-06 01:50:45.89521
163	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MTcyNTgxLCJleHAiOjE3NTQ3NzczODF9.T8exSeO2IdC7rKYw65BA8Ni4dvGEKLmofwCUHwAkvfQ	2025-08-10 01:09:41.547998	2025-08-06 01:50:45.89521
166	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MjI2ODQ4LCJleHAiOjE3NTQ4MzE2NDh9.bCtYODWZxHcFJv3SW8LuPre1DRheSd8vGJCfhSbF2lw	2025-08-10 16:14:08.219032	2025-08-06 01:50:45.89521
167	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MjI3MjY5LCJleHAiOjE3NTQ4MzIwNjl9.iCLVQZtozXaiscTXVOQ1_LtLqLSidFPY1SkWa7yPhn8	2025-08-10 16:21:09.105437	2025-08-06 01:50:45.89521
172	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MjUwNzczLCJleHAiOjE3NTQ4NTU1NzN9.OlSte93mM2ZhCDmmsbkFRZ5tM0486z0d8zNBlMJqhOo	2025-08-10 22:52:53.762668	2025-08-06 01:50:45.89521
174	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MzE0NTY2LCJleHAiOjE3NTQ5MTkzNjZ9.WF2hrOkO449QMIQs3b8NANkTnKCLFRGOYf7SOPPoLgc	2025-08-11 16:36:06.04644	2025-08-06 01:50:45.89521
176	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0MzM0ODc2LCJleHAiOjE3NTQ5Mzk2NzZ9.E783018aSRLV0aEv-Fa8RecnYsgvQ39TmB9xKqo6C1g	2025-08-11 22:14:36.708273	2025-08-06 01:50:45.89521
177	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0Mzc4Mjg1LCJleHAiOjE3NTQ5ODMwODV9.YXA0lbczTyHOQw1KCStAVOu6IljFBhehX2IShTe_LHs	2025-08-12 10:18:05.574891	2025-08-06 01:50:45.89521
187	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbm90bWFoeUBnbWFpbC5jb20iLCJpYXQiOjE3NTQ0MzkyOTMsImV4cCI6MTc1NTA0NDA5M30.AWFQkx0-r0BEll7-vHucE4vXGkDdCiw_u05Kw168V0U	2025-08-13 03:14:53	2025-08-06 03:14:53.991634
188	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc1NDQzOTQzMSwiZXhwIjoxNzU1MDQ0MjMxfQ.1BrY-HjKL0pgBfBh6G_DuQ_9Cue-wAtcriXZeJWg-8Q	2025-08-13 03:17:11.023052	2025-08-06 03:17:11.023052
190	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1aGVuYWFiZWJlMDg2QGdtYWlsLmNvbSIsImlhdCI6MTc1NDQ2ODI2MiwiZXhwIjoxNzU1MDczMDYyfQ.h0vHeWd7XaS_DQT8HfBMDfjHeXU7PiBhkStDALa-Hz0	2025-08-13 11:17:42	2025-08-06 11:17:42.473326
191	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1aGVuYWFiZWJlMDg2QGdtYWlsLmNvbSIsImlhdCI6MTc1NDQ2ODI2MiwiZXhwIjoxNzU1MDczMDYyfQ.h0vHeWd7XaS_DQT8HfBMDfjHeXU7PiBhkStDALa-Hz0	2025-08-13 11:17:42	2025-08-06 11:17:42.72813
199	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU0NDcwNjEzLCJleHAiOjE3NTUwNzU0MTN9.rEifB7-yAXcPK3qzrO_T9B44Z50m2ueKuBLcPQHbrGE	2025-08-13 11:56:53.033182	2025-08-06 11:56:53.033182
212	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MDMyNzYxLCJleHAiOjE3NTU2Mzc1NjF9.QfpHK778is7dsXfzu-McelUr53RgNvQUWfc8OYtIGZI	2025-08-20 00:06:01.372795	2025-08-13 00:06:01.372795
213	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MDkxNTM2LCJleHAiOjE3NTU2OTYzMzZ9.F8ND-0FnCAqeh-FUu2iYitjlNg4a5id-u98OmFJcLZQ	2025-08-20 16:25:36.079179	2025-08-13 16:25:36.079179
214	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MDkyMjAxLCJleHAiOjE3NTU2OTcwMDF9.oto2n4v2glUrhjmvHpKJZXud0GqmMqLP8U1M4xxvDGg	2025-08-20 16:36:41.873784	2025-08-13 16:36:41.873784
216	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTEwMTA1LCJleHAiOjE3NTU3MTQ5MDV9.aOMxRz1i5DOyg5mleEOZs-1SUo1LwoT4n6aOqCkXPxg	2025-08-20 21:35:05.877024	2025-08-13 21:35:05.877024
218	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTE0OTIyLCJleHAiOjE3NTU3MTk3MjJ9.rTbVXJYWDdVbF78IDCLkCH8Yj-KzdfrOIE4xrat0hyM	2025-08-20 22:55:22.37526	2025-08-13 22:55:22.37526
219	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTE1MDA0LCJleHAiOjE3NTU3MTk4MDR9.ZjUi2Llk2_fSTF3k1P1gQbEdeo2C-IT6ARAsH--LJ7k	2025-08-20 22:56:44.623536	2025-08-13 22:56:44.623536
220	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTE1MTE2LCJleHAiOjE3NTU3MTk5MTZ9.UH3d1FaXE44aA715Rafa5ux2WWXeGBEz7916dCxQ-as	2025-08-20 22:58:36.878019	2025-08-13 22:58:36.878019
223	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTE5NDM2LCJleHAiOjE3NTU3MjQyMzZ9.9f-SpufJ1vyfcEPrweYzL9hChohzacgqezv53F_cFmE	2025-08-21 00:10:36.44752	2025-08-14 00:10:36.44752
224	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTE5OTkzLCJleHAiOjE3NTU3MjQ3OTN9.aiXcN9YHnnowuCoSa773Aw0-POcyjhHn1QQJ9qaUvyY	2025-08-21 00:19:53.834062	2025-08-14 00:19:53.834062
229	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTY4Mjg1LCJleHAiOjE3NTU3NzMwODV9.spuPLDBAUOy_dHrMjk8JdP6ee7JN_Wc7x5SIIFxnRWU	2025-08-21 13:44:45.627948	2025-08-14 13:44:45.627948
235	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTcyOTUyLCJleHAiOjE3NTU3Nzc3NTJ9.JfD1EnN9EHGc7HsQRfhkSqPYO4_U9CrKdveVvuUlPko	2025-08-21 15:02:32.113171	2025-08-14 15:02:32.113171
236	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTc2NDQzLCJleHAiOjE3NTU3ODEyNDN9.uvYKOIpYXXttuPPmhPikjLlLcA9El92gtM3Z_OVpVHs	2025-08-21 16:00:43.28887	2025-08-14 16:00:43.28887
237	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTc2NDkxLCJleHAiOjE3NTU3ODEyOTF9.QaZ9DP3fz7dV9bhoR96a7hBmFc_ei5Kxf07Bh-OfzQI	2025-08-21 16:01:31.668199	2025-08-14 16:01:31.668199
238	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTgwNDUwLCJleHAiOjE3NTU3ODUyNTB9.TesRLgUWDWzO5D2VbdBg93R4D1syjhwzWEzl_ycxqgo	2025-08-21 17:07:30.475316	2025-08-14 17:07:30.475316
239	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MTkxMTA0LCJleHAiOjE3NTU3OTU5MDR9.ehsX-by8DdtWYC9hP19OuVYk2maT5WC2iCc3sLqUmbE	2025-08-21 20:05:04.593895	2025-08-14 20:05:04.593895
241	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MjA1MDY0LCJleHAiOjE3NTU4MDk4NjR9.T4XOjZUXTDJGk_innR9w7a3b1K-7-wZI1x_BDNAR1uI	2025-08-21 23:57:44.316039	2025-08-14 23:57:44.316039
243	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MjU4OTA5LCJleHAiOjE3NTU4NjM3MDl9.nO5wrATtBNZkV9MNRNv0YDJwSNYvdMjJWlHSxlb0Dy8	2025-08-22 14:55:09.907799	2025-08-15 14:55:09.907799
244	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MzUyNTMxLCJleHAiOjE3NTU5NTczMzF9.2Y8EecBjaJRuzGwdKprkMUT8OmEtrsbqkbn5HTX6RNU	2025-08-23 16:55:31.765902	2025-08-16 16:55:31.765902
245	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MzYxNjkzLCJleHAiOjE3NTU5NjY0OTN9.9GtXQkWUJt6vJjHYat4moJ_oM3vxSEyBNir4-QzF7Rw	2025-08-23 19:28:13.395608	2025-08-16 19:28:13.395608
246	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MzY3MTgzLCJleHAiOjE3NTU5NzE5ODN9.wESthCRIujWaeyDQKw3cNlaDyXx4lToXqpN-LRfMF1o	2025-08-23 20:59:43.698505	2025-08-16 20:59:43.698505
248	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MzczMTU5LCJleHAiOjE3NTU5Nzc5NTl9.I84eMrSD1mNOnIxHGcAla-J3xESOM9bMWdN2w80Yqm8	2025-08-23 22:39:19.796452	2025-08-16 22:39:19.796452
249	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1MzkxMDkyLCJleHAiOjE3NTU5OTU4OTJ9.V4ZAd2efYmSkaEheJgdnZPx08rlmkQ8qzkDKQvpAEtM	2025-08-24 03:38:12.08231	2025-08-17 03:38:12.08231
250	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NDE2OTU1LCJleHAiOjE3NTYwMjE3NTV9.ZWm0maBZfVJhT40yyntUd09g9SAXxb6cf4pqD0AkFlw	2025-08-24 10:49:15.807625	2025-08-17 10:49:15.807625
251	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NDUxOTgxLCJleHAiOjE3NTYwNTY3ODF9.-GDWB3D0JZmZO0X8lIM9TWL8IP2bpL5uUo1LLPM9D-0	2025-08-24 20:33:01.767493	2025-08-17 20:33:01.767493
252	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NDU0Njk2LCJleHAiOjE3NTYwNTk0OTZ9.w-Z2StxknozbG-vk8MplQD1VLnlTvuYCNzTZ-s1TAkw	2025-08-24 21:18:16.580052	2025-08-17 21:18:16.580052
253	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NTA3MDYyLCJleHAiOjE3NTYxMTE4NjJ9.aUikGm_jqrfBQz1rwE4DIg9uZI7cN_y4s46lXxY3Ah8	2025-08-25 11:51:02.018847	2025-08-18 11:51:02.018847
255	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NTUxODIyLCJleHAiOjE3NTYxNTY2MjJ9.Gg5l7QSjMJ7_de_y8lM3t-aKJC3_aSJG7u6W6U9llno	2025-08-26 00:17:02.264713	2025-08-19 00:17:02.264713
260	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NjExNjEzLCJleHAiOjE3NTYyMTY0MTN9.Ov9CN6tmsladp8V8jgU7ydIYw5aluwDCqCM0eU0vh3I	2025-08-26 16:53:33.850132	2025-08-19 16:53:33.850132
261	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NjI3MjI4LCJleHAiOjE3NTYyMzIwMjh9.1GHdddVLBt3Cj3vyoAL0X2E_d8sifwX9ig0GZhnhZP8	2025-08-26 21:13:48.635587	2025-08-19 21:13:48.635587
262	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NjMzMjg5LCJleHAiOjE3NTYyMzgwODl9.VM-LokXGpRL3enIsYFYlkb2ZwC8hwE1V2KL4BbI69RE	2025-08-26 22:54:49.471135	2025-08-19 22:54:49.471135
263	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1Njg1NTMxLCJleHAiOjE3NTYyOTAzMzF9.uIXsOsLMETRUU_we64xzHI9Z6zDAQxUE0ZUuFNeYEAw	2025-08-27 13:25:31.029141	2025-08-20 13:25:31.029141
272	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NzE5MDgwLCJleHAiOjE3NTYzMjM4ODB9.-lyhI1Ufn_tLbcLSXyQa9voZQtSpROYrTlkip4TT-GM	2025-08-27 22:44:40.242368	2025-08-20 22:44:40.242368
281	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1NzMyOTgzLCJleHAiOjE3NTYzMzc3ODN9.PFCxhoLHiHnPog-RGJVE5T-qMN2nGKmvEmFEoC_vx1Y	2025-08-28 02:36:23.301086	2025-08-21 02:36:23.301086
295	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1Nzc4MDczLCJleHAiOjE3NTYzODI4NzN9.xujZEl6psBcI9Q4n8SNebv3qfLk_KkdVmNJ7_XS5oPo	2025-08-28 15:07:53.040532	2025-08-21 15:07:53.040532
299	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1ODA4OTc1LCJleHAiOjE3NTY0MTM3NzV9.2jzcUDejYnGjZaTKWLxDVg_qfxPz-QRKJQDFSPyNbzU	2025-08-28 23:42:55.796557	2025-08-21 23:42:55.796557
300	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1ODg3MzQwLCJleHAiOjE3NTY0OTIxNDB9.nQeY2z-svadiXoj63ju9Egt-gZBrEDMvaxnhCSQQd2s	2025-08-29 21:29:00.631653	2025-08-22 21:29:00.631653
301	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU1OTg2OTM3LCJleHAiOjE3NTY1OTE3Mzd9.45FUolk7r1t6_PlJGU-4XHHrxbhHQ8478bPv8yUSKBM	2025-08-31 01:08:57.697767	2025-08-24 01:08:57.697767
303	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDY2NDI5LCJleHAiOjE3NTY2NzEyMjl9.xX7zGxC8szBbJEBVxpqs6_MZKfPCaSWeaZtDTQg1-xw	2025-08-31 23:13:49.48137	2025-08-24 23:13:49.48137
304	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDY4MTcyLCJleHAiOjE3NTY2NzI5NzJ9.VbnNSrqTe9MZ5U9Cf-OjuVdnHmzVzcCJnFBENc6RS68	2025-08-31 23:42:52.853404	2025-08-24 23:42:52.853404
305	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDczMzI0LCJleHAiOjE3NTY2NzgxMjR9.mvg_12R5LYnlklJULhpl7q5teVrcTTiyyRHy5F_9ZWc	2025-09-01 01:08:44.794804	2025-08-25 01:08:44.794804
306	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDczMzgwLCJleHAiOjE3NTY2NzgxODB9.mOaWi4PbpcGyXw8XKvIgAlvM7bgNBmj9r6-4pn4SQcw	2025-09-01 01:09:40.099976	2025-08-25 01:09:40.099976
307	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc0ODg1LCJleHAiOjE3NTY2Nzk2ODV9.lYjthFJ7wJbwxlg3cDSUtBNiAJf_NatulE9wEYeh5Sw	2025-09-01 01:34:45.124996	2025-08-25 01:34:45.124996
308	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc0OTY0LCJleHAiOjE3NTY2Nzk3NjR9.1IxLgYn8LhnRmlKGWnUm_Dni-FizpX9xDIySwQtjOWc	2025-09-01 01:36:04.45081	2025-08-25 01:36:04.45081
309	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1MDQxLCJleHAiOjE3NTY2Nzk4NDF9.ac4eHmWGz8OaQ12I9HZoipG6Dk3KIUHlSX9C3OtxHsU	2025-09-01 01:37:21.157884	2025-08-25 01:37:21.157884
310	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1NTgzLCJleHAiOjE3NTY2ODAzODN9.3x-byjNNWUPdhZ8n74cNw6RFojh3myAZeMmq7amiF0Q	2025-09-01 01:46:23.163343	2025-08-25 01:46:23.163343
311	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1NjIxLCJleHAiOjE3NTY2ODA0MjF9.p8ehRJOQBnlZpgylA0jsPkoyiYhzFpklJv5cAuIQIqQ	2025-09-01 01:47:01.129109	2025-08-25 01:47:01.129109
312	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1Njc4LCJleHAiOjE3NTY2ODA0Nzh9.oRUoYqvr1bh4K3CVRu0IWY7go0mSg_-M7zAAHol_yW0	2025-09-01 01:47:58.858943	2025-08-25 01:47:58.858943
313	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1ODkxLCJleHAiOjE3NTY2ODA2OTF9.aLzVxvJqraO2PaTEpFtZjVts3ApRVqaV5e_AZSmVBcQ	2025-09-01 01:51:31.671057	2025-08-25 01:51:31.671057
314	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MDc1OTUwLCJleHAiOjE3NTY2ODA3NTB9.CLoP09IH4v0qdMis_kFlALBhQu63coEsyWj3f8rXvwc	2025-09-01 01:52:30.055521	2025-08-25 01:52:30.055521
318	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MTA5ODQ0LCJleHAiOjE3NTY3MTQ2NDR9.EYgTzr6rQGxQ7CaKVO9_tnBmzlMHRZ3k7sa0xq79l14	2025-09-01 11:17:24.407468	2025-08-25 11:17:24.407468
319	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MTQzMjEzLCJleHAiOjE3NTY3NDgwMTN9.H2c1PewdUGZH7wk0TYWjm8MyhJQW1GrKAs6iwcWnYI8	2025-09-01 20:33:33.134646	2025-08-25 20:33:33.134646
322	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2MjI2NjcyLCJleHAiOjE3NTY4MzE0NzJ9.k6dbRk2ci4qEsD_vKC0zRf8LTFOu9U3b8FotEbKvGB8	2025-09-02 19:44:32.981353	2025-08-26 19:44:32.981353
323	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2Mjg5OTgwLCJleHAiOjE3NTY4OTQ3ODB9.yYBX0z1ALEDySkzuueTzZ76B79tSwyG1VD60kTyqMEI	2025-09-03 13:19:40.539873	2025-08-27 13:19:40.539873
327	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NDIxMTM3LCJleHAiOjE3NTcwMjU5Mzd9.7aIMK4_jptNuzn1GO0PkydREvUmymaJxTz6sYaxmmkg	2025-09-05 01:45:37.11981	2025-08-29 01:45:37.11981
328	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NDYzMTUzLCJleHAiOjE3NTcwNjc5NTN9.Zi5lrZTZHUd9_dzEwgXhLGoMAC9u8UTZydMUl55oR7o	2025-09-05 13:25:53.117076	2025-08-29 13:25:53.117076
329	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NTQ1NTc0LCJleHAiOjE3NTcxNTAzNzR9.uRQqJQUcH5F51VtZdpF3Kx974mou9qYbP_oPMdvQn6c	2025-09-06 12:19:34.641837	2025-08-30 12:19:34.641837
330	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NTYxMzI2LCJleHAiOjE3NTcxNjYxMjZ9.Y21JgSTqkDy-sqbK9GS6zAsUAJ1k3jdVj1PE3Kc756c	2025-09-06 16:42:06.040189	2025-08-30 16:42:06.040189
331	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NTc0NTYzLCJleHAiOjE3NTcxNzkzNjN9.zLsP312V8JVEkQaqjKfSMJ0q5o6hyBi34_-AYMSuuzo	2025-09-06 20:22:43.731829	2025-08-30 20:22:43.731829
332	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NjI2ODAzLCJleHAiOjE3NTcyMzE2MDN9.VS0komQhHEGpVJNKIZPb3AZg5h_YH0v-t_SMQPzgwe0	2025-09-07 10:53:23.113325	2025-08-31 10:53:23.113325
333	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NjQ1MjkwLCJleHAiOjE3NTcyNTAwOTB9.uKKygOSAv09SMFl7chEVQALzN-30LPlZPfIhNHP7Ywk	2025-09-07 16:01:30.17831	2025-08-31 16:01:30.17831
334	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NjYxODk2LCJleHAiOjE3NTcyNjY2OTZ9.yUGFeAWoB1omB94pAnIYmCTgB5vpY5LMUupB6uAU2kk	2025-09-07 20:38:16.094763	2025-08-31 20:38:16.094763
341	61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjEsImVtYWlsIjoibHVoZW5hYWJlYmVAZ21haWwuY29tIiwiaWF0IjoxNzU2NzYwMDA3LCJleHAiOjE3NTczNjQ4MDd9.Lah813m8ddNbrDeFEXIumOrCeJbaUNfc11uhOKudAcI	2025-09-08 23:53:27	2025-09-01 23:53:27.439594
342	61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjEsImVtYWlsIjoibHVoZW5hYWJlYmVAZ21haWwuY29tIiwiaWF0IjoxNzU2NzYwMDA3LCJleHAiOjE3NTczNjQ4MDd9.Lah813m8ddNbrDeFEXIumOrCeJbaUNfc11uhOKudAcI	2025-09-08 23:53:27	2025-09-01 23:53:27.541641
343	61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjEsImVtYWlsIjoibHVoZW5hYWJlYmVAZ21haWwuY29tIiwiaWF0IjoxNzU2NzYxMTExLCJleHAiOjE3NTczNjU5MTF9.aGLB08kk8Yh0CdXXin7OrW496XN6iHcGvArnj3Qm0YM	2025-09-09 00:11:51	2025-09-02 00:11:51.115159
344	61	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjEsImVtYWlsIjoibHVoZW5hYWJlYmVAZ21haWwuY29tIiwiaWF0IjoxNzU2NzYxMTExLCJleHAiOjE3NTczNjU5MTF9.aGLB08kk8Yh0CdXXin7OrW496XN6iHcGvArnj3Qm0YM	2025-09-09 00:11:51	2025-09-02 00:11:51.222082
346	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2NzY2MjQwLCJleHAiOjE3NTczNzEwNDB9.M82FRR88oUUxkVy_HZ4tc9pxeLKat5QtCTek5b2NxKk	2025-09-09 01:37:20.865915	2025-09-02 01:37:20.865915
347	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2Nzk2NTIyLCJleHAiOjE3NTc0MDEzMjJ9.zPAezeFMGR3cOfyLhdobGVPt0uF7S89iWLmL4esTEyc	2025-09-09 10:02:02.096575	2025-09-02 10:02:02.096575
351	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2ODQ5MTgxLCJleHAiOjE3NTc0NTM5ODF9.HLl9TPsRUYw9QGAm0VWHpot-lVERpGCBjUAz-N7HwSQ	2025-09-10 00:39:41.889438	2025-09-03 00:39:41.889438
352	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2ODg3NzgxLCJleHAiOjE3NTc0OTI1ODF9.szZ4XuNBVjLV5o1njWSyc--CSwnwJ14S68zpT68VrBQ	2025-09-10 11:23:01.664022	2025-09-03 11:23:01.664022
353	63	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjMsImVtYWlsIjoibWFoZGVyeWl6ZW5nYXc2OUBnbWFpbC5jb20iLCJpYXQiOjE3NTY4OTI0MjMsImV4cCI6MTc1NzQ5NzIyM30.EyvDWCEojuWtba9WjxigN8KGSbcOThOHU8EP0B9wZa0	2025-09-10 12:40:23	2025-09-03 12:40:23.721745
354	63	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjMsImVtYWlsIjoibWFoZGVyeWl6ZW5nYXc2OUBnbWFpbC5jb20iLCJpYXQiOjE3NTY4OTI0MjQsImV4cCI6MTc1NzQ5NzIyNH0.v-k2RNJPdo2JnBDJ6Xab2H4lhKjv0bDjOk9TlPa2aUk	2025-09-10 12:40:24	2025-09-03 12:40:24.55406
355	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2OTExOTIzLCJleHAiOjE3NTc1MTY3MjN9.GlLm6NgRVBZv5fdfk3yyTYRB8K-CvH4mdTxaxiaHjdU	2025-09-10 18:05:23.131201	2025-09-03 18:05:23.131201
356	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU2OTgxMjEzLCJleHAiOjE3NTc1ODYwMTN9.3wk4z8ey_CjNU4BNAX06szKXY6d5nxKFbCeYuTVpcvg	2025-09-11 13:20:13.425537	2025-09-04 13:20:13.425537
357	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MDYyMzk5LCJleHAiOjE3NTc2NjcxOTl9.VqNa5CUgb2GraOHekq2wP8RPLtFRi38RoDOyLt8uW78	2025-09-12 11:53:19.389906	2025-09-05 11:53:19.389906
358	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MDgxOTQ1LCJleHAiOjE3NTc2ODY3NDV9.tTXA25c1tcLTnrrTIS6rBkYkM61gJjkgNGu82TgbEyQ	2025-09-12 17:19:05.022283	2025-09-05 17:19:05.022283
361	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXdzIiwiaWF0IjoxNzU3MTk4OTIwLCJleHAiOjE3NTc4MDM3MjB9.JYTAodYVnK4lVOyPBSR4MBnovSvr0okoaxsqvb-HKPc	2025-09-14 01:48:40	2025-09-07 01:48:40.059214
360	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MTk4ODk1LCJleHAiOjE3NTc4MDM2OTV9.k09iVbIuzk6HL1ypR1JMiyB17aTyplZ9FZtchPRWih4	2025-09-14 01:48:15.411964	2025-09-07 01:48:15.411964
362	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXdzIiwiaWF0IjoxNzU3MTk4OTIwLCJleHAiOjE3NTc4MDM3MjB9.JYTAodYVnK4lVOyPBSR4MBnovSvr0okoaxsqvb-HKPc	2025-09-14 01:48:40	2025-09-07 01:48:40.572305
365	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM1MjE5LCJleHAiOjE3NTc4NDAwMTl9._uTew2CGQQqya-MuexVJjr3fMQYPvyKoyUs9R_2oHss	2025-09-14 11:53:39	2025-09-07 11:53:39.177926
366	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM1MjE5LCJleHAiOjE3NTc4NDAwMTl9._uTew2CGQQqya-MuexVJjr3fMQYPvyKoyUs9R_2oHss	2025-09-14 11:53:39	2025-09-07 11:53:39.728744
367	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM1ODY1LCJleHAiOjE3NTc4NDA2NjV9.aSrOrq959T9AdRjyhTIV0TJ0WpH2LOSTtmtlY30RQFI	2025-09-14 12:04:25	2025-09-07 12:04:25.173231
368	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM1ODY1LCJleHAiOjE3NTc4NDA2NjV9.aSrOrq959T9AdRjyhTIV0TJ0WpH2LOSTtmtlY30RQFI	2025-09-14 12:04:25	2025-09-07 12:04:25.89624
369	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM3OTgxLCJleHAiOjE3NTc4NDI3ODF9.LZTQuZ_Y2kZjiZc2pqN3xneyh0GiKTwwBibF3H9u0-Y	2025-09-14 12:39:41	2025-09-07 12:39:41.983219
370	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjM3OTgyLCJleHAiOjE3NTc4NDI3ODJ9.u6jt6_6Z2iHuyZ00XQPtNKrDxHa4awo8MaF3xmSHKVU	2025-09-14 12:39:42	2025-09-07 12:39:42.065272
371	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjQ5NjYyLCJleHAiOjE3NTc4NTQ0NjJ9.ma_d4OEQvHyuzBcicfxQP-z_gxVAR8KrPCjVg4jS1GA	2025-09-14 15:54:22	2025-09-07 15:54:22.81125
372	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjQ5NjYzLCJleHAiOjE3NTc4NTQ0NjN9.wYEi9Oz2bakshs7Uyr0ig9mtmsn0KK3X-_Jqhd97Ssw	2025-09-14 15:54:23	2025-09-07 15:54:23.434177
373	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjUwMzcxLCJleHAiOjE3NTc4NTUxNzF9.xniPEw39YR30nW7_oYSwnAfZt7hmxqvFnnHWNDqo970	2025-09-14 16:06:11	2025-09-07 16:06:11.690162
374	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuYXd0IiwiaWF0IjoxNzU3MjUwMzcxLCJleHAiOjE3NTc4NTUxNzF9.xniPEw39YR30nW7_oYSwnAfZt7hmxqvFnnHWNDqo970	2025-09-14 16:06:11	2025-09-07 16:06:11.778004
375	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjUxMTA2LCJleHAiOjE3NTc4NTU5MDZ9.GN5PdZqdq_ozADg6FaxfMPwSt5ga6Nlp-FXIscCHq40	2025-09-14 16:18:26	2025-09-07 16:18:26.753931
376	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjUxMTA2LCJleHAiOjE3NTc4NTU5MDZ9.GN5PdZqdq_ozADg6FaxfMPwSt5ga6Nlp-FXIscCHq40	2025-09-14 16:18:26	2025-09-07 16:18:26.854061
377	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTIwMjUsImV4cCI6MTc1Nzg1NjgyNX0.PCNpK2vyk4S6rTJSuQgR5zYw0qaxBM-YawU2YHhdQ1A	2025-09-14 16:33:45	2025-09-07 16:33:45.414709
378	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTIwMjUsImV4cCI6MTc1Nzg1NjgyNX0.PCNpK2vyk4S6rTJSuQgR5zYw0qaxBM-YawU2YHhdQ1A	2025-09-14 16:33:45	2025-09-07 16:33:45.67211
379	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTIyNDgsImV4cCI6MTc1Nzg1NzA0OH0.zdxbBstOCpc0UdX1O_aAd51tW_vHNAihgLPhaTJ6UqA	2025-09-14 16:37:28	2025-09-07 16:37:28.353352
380	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTIyNDgsImV4cCI6MTc1Nzg1NzA0OH0.zdxbBstOCpc0UdX1O_aAd51tW_vHNAihgLPhaTJ6UqA	2025-09-14 16:37:28	2025-09-07 16:37:28.456385
381	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTI1ODksImV4cCI6MTc1Nzg1NzM4OX0.yGHzeOxH9pTRxdwunPqquUSQWEq9B1AhrpTqOkWgDD0	2025-09-14 16:43:09	2025-09-07 16:43:09.065165
382	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTI1ODksImV4cCI6MTc1Nzg1NzM4OX0.yGHzeOxH9pTRxdwunPqquUSQWEq9B1AhrpTqOkWgDD0	2025-09-14 16:43:09	2025-09-07 16:43:09.172518
383	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTM2NzcsImV4cCI6MTc1Nzg1ODQ3N30.XWDZZCu_iDvPDz49-0WRwYAv3rKfaFs1jnWyihWE498	2025-09-14 17:01:17	2025-09-07 17:01:17.369477
384	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTM2NzcsImV4cCI6MTc1Nzg1ODQ3N30.XWDZZCu_iDvPDz49-0WRwYAv3rKfaFs1jnWyihWE498	2025-09-14 17:01:17	2025-09-07 17:01:17.610448
385	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQyNjIsImV4cCI6MTc1Nzg1OTA2Mn0.5inmCqje3Fl-Eq9PzTREvqTYnjgZdLhFF6mIAJc5jaI	2025-09-14 17:11:02	2025-09-07 17:11:02.688587
386	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQyNjIsImV4cCI6MTc1Nzg1OTA2Mn0.5inmCqje3Fl-Eq9PzTREvqTYnjgZdLhFF6mIAJc5jaI	2025-09-14 17:11:02	2025-09-07 17:11:02.989772
387	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQzMTYsImV4cCI6MTc1Nzg1OTExNn0.xK-EzVu2Q92czhDjgW1Peyt2EXx9nfMAYfNCdoItiA4	2025-09-14 17:11:56	2025-09-07 17:11:56.631835
388	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQzMTYsImV4cCI6MTc1Nzg1OTExNn0.xK-EzVu2Q92czhDjgW1Peyt2EXx9nfMAYfNCdoItiA4	2025-09-14 17:11:56	2025-09-07 17:11:56.71825
389	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ0NjQsImV4cCI6MTc1Nzg1OTI2NH0.8_uMlh9i5hyKeycLlVoSmyOvAMAhwQ_4ij6ZovU-DAc	2025-09-14 17:14:24	2025-09-07 17:14:24.986907
390	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ0NjUsImV4cCI6MTc1Nzg1OTI2NX0.hRUhntXuXcyIXsqt7lxgmEuiIa9DRI01IZG5QppPLpc	2025-09-14 17:14:25	2025-09-07 17:14:25.10179
391	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ2MTgsImV4cCI6MTc1Nzg1OTQxOH0.LVXGOlxeyKJm5KpNCFqamg16ephHAsTL9Y0r7Fs8j3c	2025-09-14 17:16:58	2025-09-07 17:16:58.529482
392	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ2MTgsImV4cCI6MTc1Nzg1OTQxOH0.LVXGOlxeyKJm5KpNCFqamg16ephHAsTL9Y0r7Fs8j3c	2025-09-14 17:16:58	2025-09-07 17:16:59.103112
393	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ4OTgsImV4cCI6MTc1Nzg1OTY5OH0.nCnsLcuawvYW5_RVWIhUKDqC7ousI8k5NKxCM3_NyFU	2025-09-14 17:21:38	2025-09-07 17:21:38.330605
394	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTQ4OTgsImV4cCI6MTc1Nzg1OTY5OH0.nCnsLcuawvYW5_RVWIhUKDqC7ousI8k5NKxCM3_NyFU	2025-09-14 17:21:38	2025-09-07 17:21:38.993064
395	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU0OTYxLCJleHAiOjE3NTc4NTk3NjF9.y1ZLz-jIyLJGejhwI7974JmbNQneZ5YXQAJTkFI3gCg	2025-09-14 17:22:41	2025-09-07 17:22:41.09153
396	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU0OTYxLCJleHAiOjE3NTc4NTk3NjF9.y1ZLz-jIyLJGejhwI7974JmbNQneZ5YXQAJTkFI3gCg	2025-09-14 17:22:41	2025-09-07 17:22:41.849037
397	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU1MDQ0LCJleHAiOjE3NTc4NTk4NDR9.1pa18I9N2pMsEmysGKwU7sEhK1j8WnhLDPFGfrKmy-s	2025-09-14 17:24:04	2025-09-07 17:24:04.304991
398	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU1MDQ0LCJleHAiOjE3NTc4NTk4NDR9.1pa18I9N2pMsEmysGKwU7sEhK1j8WnhLDPFGfrKmy-s	2025-09-14 17:24:04	2025-09-07 17:24:05.095043
399	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU1MTkyLCJleHAiOjE3NTc4NTk5OTJ9.l52bUtxec1aJP7rKxgM8NO19eDq2xRY4ba3HcAhCX3M	2025-09-14 17:26:32	2025-09-07 17:26:32.115777
400	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU1MTkyLCJleHAiOjE3NTc4NTk5OTJ9.l52bUtxec1aJP7rKxgM8NO19eDq2xRY4ba3HcAhCX3M	2025-09-14 17:26:32	2025-09-07 17:26:32.789403
401	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTUyNDgsImV4cCI6MTc1Nzg2MDA0OH0.TnwcYR66tuNemntzqYbJ1GOQmtnw7JKb1VK3NOeIKQs	2025-09-14 17:27:28	2025-09-07 17:27:28.195542
402	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTUyNDgsImV4cCI6MTc1Nzg2MDA0OH0.TnwcYR66tuNemntzqYbJ1GOQmtnw7JKb1VK3NOeIKQs	2025-09-14 17:27:28	2025-09-07 17:27:28.981403
403	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU0MzcsImV4cCI6MTc1Nzg2MDIzN30.Ol5JQY6ln1wmjh2UdZP1zQ1u9zLiJOUpR0UsBZ05CjY	2025-09-14 17:30:37	2025-09-07 17:30:38.004921
404	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU0MzgsImV4cCI6MTc1Nzg2MDIzOH0.Xzc5HTmwLGRPZ3qtdfX7c2zIz0vkRiLMvEh4x3OWeZg	2025-09-14 17:30:38	2025-09-07 17:30:38.719591
405	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU1NDAsImV4cCI6MTc1Nzg2MDM0MH0.ZjrkjHO29Rvepo9dYX312YwaHh8nsiTUBAO9S9NU-bQ	2025-09-14 17:32:20	2025-09-07 17:32:20.60167
406	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU1NDEsImV4cCI6MTc1Nzg2MDM0MX0.shrhXRtqYBxfcDtppExB0cbJ5VVoP6mCRqLhTKTezAw	2025-09-14 17:32:21	2025-09-07 17:32:21.33165
407	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU2MjksImV4cCI6MTc1Nzg2MDQyOX0.q-94icGYoX0PJ-ZBumXlb99JUokll4HMVqwdwmQ92HI	2025-09-14 17:33:49	2025-09-07 17:33:49.265735
408	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU2MjksImV4cCI6MTc1Nzg2MDQyOX0.q-94icGYoX0PJ-ZBumXlb99JUokll4HMVqwdwmQ92HI	2025-09-14 17:33:49	2025-09-07 17:33:50.123753
409	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU2NzcsImV4cCI6MTc1Nzg2MDQ3N30.NlNCq7pyc3GpPqgXhNdafcX2TD7r46UoyJia3rQ6hB8	2025-09-14 17:34:37	2025-09-07 17:34:37.162048
410	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU2NzcsImV4cCI6MTc1Nzg2MDQ3N30.NlNCq7pyc3GpPqgXhNdafcX2TD7r46UoyJia3rQ6hB8	2025-09-14 17:34:37	2025-09-07 17:34:37.901745
411	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU4MTgsImV4cCI6MTc1Nzg2MDYxOH0.eknr2d6CAJ6wqVb6nWDBptKz_6SttP1K8VyGNORFguk	2025-09-14 17:36:58	2025-09-07 17:36:58.162413
412	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU4MTgsImV4cCI6MTc1Nzg2MDYxOH0.eknr2d6CAJ6wqVb6nWDBptKz_6SttP1K8VyGNORFguk	2025-09-14 17:36:58	2025-09-07 17:36:58.846954
413	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU4NzUsImV4cCI6MTc1Nzg2MDY3NX0.C325fPxHIBFjFPNZ2ceVyIB18E4KHHewS8J7Hw4KyJA	2025-09-14 17:37:55	2025-09-07 17:37:55.091809
414	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTU4NzUsImV4cCI6MTc1Nzg2MDY3NX0.C325fPxHIBFjFPNZ2ceVyIB18E4KHHewS8J7Hw4KyJA	2025-09-14 17:37:55	2025-09-07 17:37:55.677934
415	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU2MDg2LCJleHAiOjE3NTc4NjA4ODZ9.y0Qf24QtGWkOTHHp_-aVlBaUmrS4iOnkenihFB40FaY	2025-09-14 17:41:26	2025-09-07 17:41:26.342372
416	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU2MDg2LCJleHAiOjE3NTc4NjA4ODZ9.y0Qf24QtGWkOTHHp_-aVlBaUmrS4iOnkenihFB40FaY	2025-09-14 17:41:26	2025-09-07 17:41:27.023813
417	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTY4MTMsImV4cCI6MTc1Nzg2MTYxM30.kUSwhszmw3ycm5zmFHaINIW6cwdwOXe-3MX_jCttTAE	2025-09-14 17:53:33	2025-09-07 17:53:33.203783
418	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTY4MTMsImV4cCI6MTc1Nzg2MTYxM30.kUSwhszmw3ycm5zmFHaINIW6cwdwOXe-3MX_jCttTAE	2025-09-14 17:53:33	2025-09-07 17:53:33.988329
421	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTc1MTYsImV4cCI6MTc1Nzg2MjMxNn0.KdJGKf-bSzh8KWnhPj-V6khS95gXe6N5JMbF6GH80Sk	2025-09-14 18:05:16	2025-09-07 18:05:16.790536
424	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU3ODM5LCJleHAiOjE3NTc4NjI2Mzl9.PlzmYKFQESChLDh1Njtk6Qm_CIX-_sRGiOmPuH5Vpzk	2025-09-14 18:10:39	2025-09-07 18:10:39.635869
425	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU4MDM4LCJleHAiOjE3NTc4NjI4Mzh9.LeEBbQ-qxuyaF4LAkYIHWJ9DT0O7Ld2VZnd89nHUbYI	2025-09-14 18:13:58	2025-09-07 18:13:58.012477
426	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJhZG1pbmZpbmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjU4MDM4LCJleHAiOjE3NTc4NjI4Mzh9.LeEBbQ-qxuyaF4LAkYIHWJ9DT0O7Ld2VZnd89nHUbYI	2025-09-14 18:13:58	2025-09-07 18:13:58.789582
431	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTgzNzMsImV4cCI6MTc1Nzg2MzE3M30.O7jr01tCe-s6DdC81lsenobvI3ia4GYp15moRlSgyBM	2025-09-14 18:19:33	2025-09-07 18:19:33.706506
434	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTg1NjksImV4cCI6MTc1Nzg2MzM2OX0.yWQg98rYthcXkEC6EU2BiFR3m9Uveeq5LvIdjajB-CY	2025-09-14 18:22:49	2025-09-07 18:22:49.424434
435	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTg4MzksImV4cCI6MTc1Nzg2MzYzOX0.67l-gCRSDMKkxyYtnPUS2-aSz_UryLT9rF61eOhK0eg	2025-09-14 18:27:19	2025-09-07 18:27:19.836192
437	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTg4ODQsImV4cCI6MTc1Nzg2MzY4NH0.4RgM0THTTj56RyAlEZqHvcpqZI3ONAzCDS-jO3_9M-c	2025-09-14 18:28:04	2025-09-07 18:28:04.708276
438	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTkxNzAsImV4cCI6MTc1Nzg2Mzk3MH0.s4snxBcX1sh_9LFpVMeSaC5Lh4pmto9HPekLbRkjJbM	2025-09-14 18:32:50	2025-09-07 18:32:50.97552
439	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTkxNzEsImV4cCI6MTc1Nzg2Mzk3MX0.KtFR3jN51MhraOBSB7TCbw1b3LzxkHCdt3OMhQJVuHA	2025-09-14 18:32:51	2025-09-07 18:32:51.647925
440	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTkzOTQsImV4cCI6MTc1Nzg2NDE5NH0.tYdVvCEZNuux78dnmzwS32yiFePDbBnyEbUFDtEaMdM	2025-09-14 18:36:34	2025-09-07 18:36:34.854748
442	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTk0MzQsImV4cCI6MTc1Nzg2NDIzNH0.gUIzjIffJIP2eqhE3j07whdnXorGJ-9gN_uOiSRAwmU	2025-09-14 18:37:14	2025-09-07 18:37:14.419906
445	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTk1OTksImV4cCI6MTc1Nzg2NDM5OX0.baRxuaipw8Wv20kEi8PMPbyAiXbpaixqnalpd4vtLcg	2025-09-14 18:39:59	2025-09-07 18:39:59.415387
448	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNTk3MDksImV4cCI6MTc1Nzg2NDUwOX0.xkXmA-cGyJQ1r9iYCiMjfBRBZM8L3keUs_Owpl8oJ00	2025-09-14 18:41:49	2025-09-07 18:41:49.705033
449	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjA1NzMsImV4cCI6MTc1Nzg2NTM3M30.Q6V7YgoofyIJjEEGlKe4ultEYD62n92b9Ajnm2-0at4	2025-09-14 18:56:13	2025-09-07 18:56:13.546622
454	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjA4MDcsImV4cCI6MTc1Nzg2NTYwN30.Y14kv58DZfvjARH7MAsRH2d9UfhU99lijctDFLyvOBM	2025-09-14 19:00:07	2025-09-07 19:00:07.153021
455	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjA5MzYsImV4cCI6MTc1Nzg2NTczNn0.l6YKv2um4HomgAwhtd15Ywf1vVWVWfckpS-2Yglk9dw	2025-09-14 19:02:16	2025-09-07 19:02:16.778062
459	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjEwNDIsImV4cCI6MTc1Nzg2NTg0Mn0.G0HsWHWnwXbinCSXqqxkBuitVFzPeKsHRSaw1EOm32M	2025-09-14 19:04:02	2025-09-07 19:04:02.857681
460	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjE2MDIsImV4cCI6MTc1Nzg2NjQwMn0.l65qRsHL2gkpww1T5DxQv79cgwZHc25hl-lOMm48EvE	2025-09-14 19:13:22	2025-09-07 19:13:22.999887
462	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjE2NDYsImV4cCI6MTc1Nzg2NjQ0Nn0.S6Dsaoe2u5RRpVLsWc4g1USG3cllSMX1HEVN_PZ0o_0	2025-09-14 19:14:06	2025-09-07 19:14:06.299666
463	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjE2ODksImV4cCI6MTc1Nzg2NjQ4OX0.2iF-12GsQFECs8M6GETIhJjxOOaLKcMwG3b3tet2uIs	2025-09-14 19:14:49	2025-09-07 19:14:49.582977
464	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjE2OTAsImV4cCI6MTc1Nzg2NjQ5MH0.nybe5me_ZdlAeBLl4F7c4YTXzGrBp15dPNnzPFYSkCg	2025-09-14 19:14:50	2025-09-07 19:14:50.388988
467	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjE3NzUsImV4cCI6MTc1Nzg2NjU3NX0.rZL1cSyaqptO91chOAi_LB71K_PFkM8VDDmiSR6A4hM	2025-09-14 19:16:15	2025-09-07 19:16:15.683181
468	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjIzNDcsImV4cCI6MTc1Nzg2NzE0N30.v4j0WSMACNEtCD0DgRZZcaYBVT6OOGBJcm1RTnTnBc0	2025-09-14 19:25:47	2025-09-07 19:25:47.572822
469	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjIzNDgsImV4cCI6MTc1Nzg2NzE0OH0.SbjrrKSRXzzKGvUqhDX5n3JycG2YRIgND8YC5EPKdfw	2025-09-14 19:25:48	2025-09-07 19:25:48.250934
472	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjI3MjEsImV4cCI6MTc1Nzg2NzUyMX0.3-3GtX_AHbtg3U7XR0c78ZtR_tKCzD1JR6iF96ywDhQ	2025-09-14 19:32:01	2025-09-07 19:32:01.851207
475	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQzODQsImV4cCI6MTc1Nzg2OTE4NH0.XW_8UqCywYrllX5UqZZFV34l6GXyVFH5V0QNE-IUG-Y	2025-09-14 19:59:44	2025-09-07 19:59:44.411241
476	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQzODQsImV4cCI6MTc1Nzg2OTE4NH0.XW_8UqCywYrllX5UqZZFV34l6GXyVFH5V0QNE-IUG-Y	2025-09-14 19:59:44	2025-09-07 19:59:44.638651
477	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQ1NjYsImV4cCI6MTc1Nzg2OTM2Nn0.3_PzjbLViNuvmnZA1NqfsVz6pm0xw2dUgTtJH3C9Hk0	2025-09-14 20:02:46	2025-09-07 20:02:46.142823
478	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQ1ODUsImV4cCI6MTc1Nzg2OTM4NX0.C5LJ8nWexxsb4Pi2bPjo9YeueJasad2IF8zg-0nf6LQ	2025-09-14 20:03:05	2025-09-07 20:03:05.722627
479	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQ1ODUsImV4cCI6MTc1Nzg2OTM4NX0.C5LJ8nWexxsb4Pi2bPjo9YeueJasad2IF8zg-0nf6LQ	2025-09-14 20:03:05	2025-09-07 20:03:05.943468
480	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQ5NDYsImV4cCI6MTc1Nzg2OTc0Nn0.GoDZqgvJOQjiCweDBHRKHyRU_UeuxsAUwTJouwETtC8	2025-09-14 20:09:06	2025-09-07 20:09:06.09114
481	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjQ5NDYsImV4cCI6MTc1Nzg2OTc0Nn0.GoDZqgvJOQjiCweDBHRKHyRU_UeuxsAUwTJouwETtC8	2025-09-14 20:09:06	2025-09-07 20:09:06.175593
482	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjUyNjksImV4cCI6MTc1Nzg3MDA2OX0.9iGuNxKbQuGU8eS2Gd7os9H5h4StVbROvSVzeCpKeWE	2025-09-14 20:14:29	2025-09-07 20:14:29.633972
483	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNjUyNjksImV4cCI6MTc1Nzg3MDA2OX0.9iGuNxKbQuGU8eS2Gd7os9H5h4StVbROvSVzeCpKeWE	2025-09-14 20:14:29	2025-09-07 20:14:29.745688
487	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzE2NzQsImV4cCI6MTc1Nzg3NjQ3NH0.NaYI7K_QNB751kbl28BR-_ygKlwErJM8DySG9vcpucw	2025-09-14 22:01:14	2025-09-07 22:01:14.640317
491	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzU4OTMsImV4cCI6MTc1Nzg4MDY5M30.wCoAagRLGfPv3Xk3hhKr1_ra_ubZWjjWb2wplbxXqlc	2025-09-14 23:11:33	2025-09-07 23:11:34.005573
492	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzU4OTQsImV4cCI6MTc1Nzg4MDY5NH0.rXCCiGOc_vDII5Qv-kLoloeGbtmzAfRCKJtIaD8-YDI	2025-09-14 23:11:34	2025-09-07 23:11:34.006746
493	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzU5MjIsImV4cCI6MTc1Nzg4MDcyMn0.60HSXqRK5AdJcyeJ8GNTLMDgO6AqcE0SXWI5W3jRyuk	2025-09-14 23:12:02	2025-09-07 23:12:02.034666
494	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzU5MjIsImV4cCI6MTc1Nzg4MDcyMn0.60HSXqRK5AdJcyeJ8GNTLMDgO6AqcE0SXWI5W3jRyuk	2025-09-14 23:12:02	2025-09-07 23:12:02.646291
495	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzg0MTksImV4cCI6MTc1Nzg4MzIxOX0.0WCLaz7IQvqerIOADcp4zxBxFzs2mKWv9Ng6IZPm2Iw	2025-09-14 23:53:39	2025-09-07 23:53:39.288246
496	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzg0MTksImV4cCI6MTc1Nzg4MzIxOX0.0WCLaz7IQvqerIOADcp4zxBxFzs2mKWv9Ng6IZPm2Iw	2025-09-14 23:53:39	2025-09-07 23:53:39.368756
497	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzg1MTYsImV4cCI6MTc1Nzg4MzMxNn0.06hxDab8F5--V_3bV0W2W6ILkZim5dgoi0adLAp0qqI	2025-09-14 23:55:16	2025-09-07 23:55:16.806555
498	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyNzg1MTYsImV4cCI6MTc1Nzg4MzMxNn0.06hxDab8F5--V_3bV0W2W6ILkZim5dgoi0adLAp0qqI	2025-09-14 23:55:16	2025-09-07 23:55:16.989031
504	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyODYxNDksImV4cCI6MTc1Nzg5MDk0OX0.pzCVdTrHPj6IPedCJZ7Z63nTVqS1fcH_W_fBhrW4kFI	2025-09-15 02:02:29	2025-09-08 02:02:29.812168
505	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyODYxODgsImV4cCI6MTc1Nzg5MDk4OH0.ia2k1QlddQw4P0VDD7iBlfy5C6dcsUIj3Kwm1_JP5WE	2025-09-15 02:03:08	2025-09-08 02:03:08.912633
506	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyODYxODksImV4cCI6MTc1Nzg5MDk4OX0.TbG9qDB9BULRmkB_Kv1gyv_WHlgUX927r5rivdqeb7c	2025-09-15 02:03:09	2025-09-08 02:03:09.712688
508	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3Mjg5MjIyLCJleHAiOjE3NTc4OTQwMjJ9.GqiTZzzgNwGyM9C1zTpMkN2ATyY2ES821xF0fsTiEN8	2025-09-15 02:53:42.253208	2025-09-08 02:53:42.253208
509	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3Mjg5MjI2LCJleHAiOjE3NTc4OTQwMjZ9.JuDtHWVJ5HsTwCLZuQ0RlooMknYoxs6_MrJeBg5W5ZU	2025-09-15 02:53:46.383517	2025-09-08 02:53:46.383517
510	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MjkzNjAyLCJleHAiOjE3NTc4OTg0MDJ9.a3gGBuGx-8sd4hzC2WfGJVhLZUdOYamW4S7Zo7Irbhs	2025-09-15 04:06:42.301276	2025-09-08 04:06:42.301276
511	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyOTQwNTMsImV4cCI6MTc1Nzg5ODg1M30.0UqLb-FufxivcBQeDoA4jlHpmW0SOdBstzpkvtI0_SM	2025-09-15 04:14:13	2025-09-08 04:14:13.875986
512	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTcyOTQwNTMsImV4cCI6MTc1Nzg5ODg1M30.0UqLb-FufxivcBQeDoA4jlHpmW0SOdBstzpkvtI0_SM	2025-09-15 04:14:13	2025-09-08 04:14:13.971767
514	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTczMjQ5NTUsImV4cCI6MTc1NzkyOTc1NX0.LzKEIvDwqMbE8a_TXwkxsZNXZ0_5dbHw0LFzUfl114w	2025-09-15 12:49:15	2025-09-08 12:49:15.109204
515	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTczMjQ5NTUsImV4cCI6MTc1NzkyOTc1NX0.LzKEIvDwqMbE8a_TXwkxsZNXZ0_5dbHw0LFzUfl114w	2025-09-15 12:49:15	2025-09-08 12:49:15.109691
518	67	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjcsImVtYWlsIjoiYWJlYmV0YW1yYXQyMUBnbWFpbC5jb20iLCJpYXQiOjE3NTczMjg2MTgsImV4cCI6MTc1NzkzMzQxOH0.X5nMNCVAqEISMm_aj3If4wePSWxalBCGjOxMFbjppzU	2025-09-15 13:50:18	2025-09-08 13:50:18.035282
519	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MzI5NzczLCJleHAiOjE3NTc5MzQ1NzN9.e2B71Rdbk5nRCanJNCvg0ms99YTDrcAT9_KxFSpjx_M	2025-09-15 14:09:33.611737	2025-09-08 14:09:33.611737
520	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3MzYwMjg5LCJleHAiOjE3NTc5NjUwODl9.htWgnB_BVuEE0lFHSZ0lGUHmA_TdN2TpMn0LS_8aPDU	2025-09-15 22:38:09.264581	2025-09-08 22:38:09.264581
521	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NDM3MTgwLCJleHAiOjE3NTgwNDE5ODB9.FqxdOcw0wOMW8ImrI4E0xffvuEhbTc4jO5lFSrN81iI	2025-09-16 19:59:40.104045	2025-09-09 19:59:40.104045
522	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NDQ3NTUyLCJleHAiOjE3NTgwNTIzNTJ9.0aMQovANVpaCdTxJzEs3H0c9bqwEfVm5ScOQUuadZ5s	2025-09-16 22:52:32.514243	2025-09-09 22:52:32.514243
523	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NDUyNzY2LCJleHAiOjE3NTgwNTc1NjZ9.Q4XTN2hwxtHUERia5E44gbWQpBniLfk_vM0DEmM2mzQ	2025-09-17 00:19:26.702631	2025-09-10 00:19:26.702631
524	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NTAxMzIxLCJleHAiOjE3NTgxMDYxMjF9.wZnztJTKD-2FsdtoV7OCgUcww8IPDtT_9v5DUevwzEQ	2025-09-17 13:48:41.778796	2025-09-10 13:48:41.778796
525	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NTM3ODg3LCJleHAiOjE3NTgxNDI2ODd9.JhD8B7zLp3eirk9j5S4M3C2rMMywQJOlqrhDw2pRYRk	2025-09-17 23:58:07.453555	2025-09-10 23:58:07.453555
526	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NjY5MDE0LCJleHAiOjE3NTgyNzM4MTR9.oEk6KN8lWZspLizvtbBvw9scQHz9B8J92YDErAu1QWE	2025-09-19 12:23:34.598346	2025-09-12 12:23:34.598346
530	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3Njk4MzA5LCJleHAiOjE3NTgzMDMxMDl9.i0XKLP_Ql9GAzMoCbVin3_-9w7jx0ODjjWJJcU8ebnw	2025-09-19 20:31:49.071057	2025-09-12 20:31:49.071057
531	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3Njk4ODAzLCJleHAiOjE3NTgzMDM2MDN9.Nk7dqbO6GK58H-NHaxCGkJMFfQ3t9lR_Aivj-1lPDe0	2025-09-19 20:40:03.683277	2025-09-12 20:40:03.683277
532	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3NzkyNzIxLCJleHAiOjE3NTgzOTc1MjF9.0p09R3wGuvjgcW1QnYLDHKlx9-I9FBiILwh9SqLJtio	2025-09-20 22:45:21.89345	2025-09-13 22:45:21.89345
534	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3OTU2NDUyLCJleHAiOjE3NTg1NjEyNTJ9.u12dKUIcPRUWAkN9U9n_NCkSkFuS_UC12NdhLbA3mwI	2025-09-22 20:14:12.487038	2025-09-15 20:14:12.487038
535	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNzU3OTY3MDI0LCJleHAiOjE3NTg1NzE4MjR9.vmlfyR_lHHHIRPUNc31u6HZx362TN4MBUQM2NTj9a0M	2025-09-22 23:10:24.278357	2025-09-15 23:10:24.278357
\.


--
-- Data for Name: refresh_tokens2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens2 (jti, user_id, token_hash, revoked, previous_jti, replaced_by_jti, created_at, expires_at) FROM stdin;
2c49bf4e-d4c6-4909-b649-ec92b1e7d9b3	67	6ccc30c2ecc0999c33dee408d428092b77db93f766001f74982f7a619c6203ab	f	\N	\N	2025-09-08 16:43:44.593911+03	2025-09-15 16:43:44.593911+03
81b102a0-c8f1-4b9d-af1c-230cf21b4ece	67	12e4c234a2854be77239c227115b897925b64c2d589c5237cbb435353f7bd9f8	f	\N	\N	2025-09-08 16:45:59.838108+03	2025-09-15 16:45:59.838108+03
c8ec140c-f0f2-4c8b-ae71-456b02491150	67	ddea1a1987e2e85d4e6ec9e241d40fcded34c4ba624ea7a78996b618a2936faa	f	\N	\N	2025-09-08 16:46:46.397505+03	2025-09-15 16:46:46.397505+03
34fcde6e-cdea-4a3d-b18b-6d26da3c5d67	67	7e38c3715c1caa34bedfbefcc442d92efd5d6d1a5d25800de15a136a23178536	t	b8cd96bd-2668-438e-bf38-61a3b5509570	802bd77f-709a-4b7b-85a2-0615a52731ff	2025-09-08 18:04:11.71879+03	2025-09-15 18:04:11.71879+03
ccfcbfe1-e8e7-4653-9a2d-cacd82fefe98	67	0b62a10536302e18d8399cd491847239d57a244224dcf9efa3635cdec6d77104	f	8a76dc58-3e4d-46a1-b903-236d1f0db51c	\N	2025-09-08 16:55:20.707732+03	2025-09-15 16:55:20.707732+03
8a76dc58-3e4d-46a1-b903-236d1f0db51c	67	16412b7be87455a55ecac49abebe451b63faa6e570addc7bff5b97bf1b1ccd43	t	\N	ccfcbfe1-e8e7-4653-9a2d-cacd82fefe98	2025-09-08 16:54:21.113267+03	2025-09-15 16:54:21.113267+03
ee232c40-2849-4075-8265-e3494f6e8e8d	67	a678ce123912674dc6135219ae72b66435c8229d78bababadea4e4d5c8b60844	t	cab517fe-36eb-4b5f-a99e-2fb8878561dc	\N	2025-09-08 21:58:05.733004+03	2025-09-15 21:58:05.733004+03
0d38e7a8-2721-4939-8089-3d033e62ce41	67	2640437b7ad8000588da267bbe4d80533bff0787720a07febe84a79330603380	f	c60217f4-47e9-463a-824f-eff46fc9697d	\N	2025-09-08 17:01:25.959702+03	2025-09-15 17:01:25.959702+03
c60217f4-47e9-463a-824f-eff46fc9697d	67	52c7f6b0bb47e2536aa7055ede69e7309d3be226faace89c2e870f2d3d05e54f	t	\N	0d38e7a8-2721-4939-8089-3d033e62ce41	2025-09-08 16:56:33.006213+03	2025-09-15 16:56:33.006213+03
d4699582-2303-44d6-abfe-3fe60bf76ad3	67	6d40ae1cba9b407d24939b4b21a37b4607559fbcc6792f1f3b0f6bd7ff43530e	f	cca1def8-4106-4d04-854e-c4eea68cdc91	\N	2025-09-08 17:03:01.969685+03	2025-09-15 17:03:01.969685+03
cca1def8-4106-4d04-854e-c4eea68cdc91	67	112935cc1aecfd1bd19ff03e312ae6289eff484c01358131ba13df4da62f8e14	t	\N	d4699582-2303-44d6-abfe-3fe60bf76ad3	2025-09-08 17:02:12.290939+03	2025-09-15 17:02:12.290939+03
2b43bf0b-1d63-40c7-9dfc-d5714b8654ee	67	5623ab652addf800d26a899d1b1fe02c1324eef98eb99063655cc72a9eb65c1d	t	\N	\N	2025-09-08 17:07:23.870275+03	2025-09-15 17:07:23.870275+03
802bd77f-709a-4b7b-85a2-0615a52731ff	67	8e07df018f14425ba405dc65949a9270168f5e130f496e487bfc30a9281bc304	t	34fcde6e-cdea-4a3d-b18b-6d26da3c5d67	b8b871ad-236d-4c15-b708-b2322e128bf3	2025-09-08 18:09:32.621826+03	2025-09-15 18:09:32.621826+03
8b7df6e2-e123-43a3-8f09-d53f071bb75f	67	3562a87ce0391007f971d0c57b8ffc3c99efa387fd4a96b35ccea9dfe2917ac4	f	2a5388f0-ec08-475e-bdbd-9bee1dbb8a4f	\N	2025-09-08 17:11:03.073916+03	2025-09-15 17:11:03.073916+03
2a5388f0-ec08-475e-bdbd-9bee1dbb8a4f	67	0d7d7955c38531a09baf55d3e0645c45cee98cd4e3837c4971e12c613f4b2fbd	t	\N	8b7df6e2-e123-43a3-8f09-d53f071bb75f	2025-09-08 17:09:58.584832+03	2025-09-15 17:09:58.584832+03
7642657e-0ebf-45fc-83e8-f424d732cc07	67	ce349594ed8455886148916415422506db8a74ba833235e62a92ec4835efa3d2	f	c98b186c-a5d3-477b-8d71-928417e5fca8	\N	2025-09-08 17:14:05.075286+03	2025-09-15 17:14:05.075286+03
c98b186c-a5d3-477b-8d71-928417e5fca8	67	5cc9bb242adb5d087f2437a4414945b3c0c193ec79c9a4f1bb9434ca269c47d0	t	\N	7642657e-0ebf-45fc-83e8-f424d732cc07	2025-09-08 17:13:03.515171+03	2025-09-15 17:13:03.515171+03
3090079e-71c4-4c31-bb7a-cba9d0799d2f	67	10d62fe04e8329c20680b3eecf84baca1b235daa8f32a59d46878124452edbee	f	b8b871ad-236d-4c15-b708-b2322e128bf3	\N	2025-09-08 18:11:07.255192+03	2025-09-15 18:11:07.255192+03
d4b8d2e4-51ae-494e-960a-95daeb89b01e	67	05524f6eb6bc6dd76057f8ab3c2346ac18ef43a19a5d1e657950854f48a67f31	f	e781500d-3094-41f4-83e9-1ac7cdf8775c	\N	2025-09-08 17:19:18.233216+03	2025-09-15 17:19:18.233216+03
e781500d-3094-41f4-83e9-1ac7cdf8775c	67	cd549d64fda1b1bfdb7114c705360bbf45632fea58bd9d057d43aba1b0c74bf3	t	\N	d4b8d2e4-51ae-494e-960a-95daeb89b01e	2025-09-08 17:18:36.034087+03	2025-09-15 17:18:36.034087+03
b8b871ad-236d-4c15-b708-b2322e128bf3	67	38c8a7f43d5293cc2bf6f349572e6a844dd13b67c5805bf1fd61520c971ca4e9	t	802bd77f-709a-4b7b-85a2-0615a52731ff	3090079e-71c4-4c31-bb7a-cba9d0799d2f	2025-09-08 18:10:48.321803+03	2025-09-15 18:10:48.321803+03
697bd48a-03bb-4f8f-b988-50875a200a51	67	472b69e708d20e8670a5fbd1f3de5e623f6efc99d9278ce8ea815fc07de04b64	f	b864cef7-f4e0-4bda-873b-2c057da055c3	\N	2025-09-08 17:49:52.19003+03	2025-09-15 17:49:52.19003+03
b864cef7-f4e0-4bda-873b-2c057da055c3	67	c9a1b22a4a6b966c2f419a2956487299c10df11ed201098a38bc54c8687393a8	t	\N	697bd48a-03bb-4f8f-b988-50875a200a51	2025-09-08 17:46:34.351946+03	2025-09-15 17:46:34.351946+03
196330fa-69d1-44fd-8812-787538682148	67	03fe240a26c5f9bf2075eb69d7173d1cb52184723c504b49b66cf11218cb40aa	f	1f185e29-cef7-40cf-aec7-cc3af90b228f	\N	2025-09-08 17:53:16.248072+03	2025-09-15 17:53:16.248072+03
1f185e29-cef7-40cf-aec7-cc3af90b228f	67	79c30cb82bc1f6e736b0a4469c2f4d2bbf4468b5921c31deff8d8a17d4dcf5ad	t	\N	196330fa-69d1-44fd-8812-787538682148	2025-09-08 17:52:29.030569+03	2025-09-15 17:52:29.030569+03
e6ee803a-829b-4ba9-aa32-dbfa11b983c9	67	3b5f0f1f4958d414b2aa4ccd4d72abaf640f0f3860cf677f32a89cd15a1dbe0f	t	\N	87ca19d8-67a0-4d05-825e-98eb5c32e1a6	2025-09-08 21:55:20.787083+03	2025-09-15 21:55:20.787083+03
dc64d562-6caf-4cbe-ac13-725e40aa3370	67	0f590bf2ad530a2cf33e45a2b9aba14b947b90e7c97f334fae01b679b1e72a48	t	\N	e9e86e37-cb18-47b3-9f22-ee8c668a2694	2025-09-08 17:59:00.581208+03	2025-09-15 17:59:00.581208+03
c540a54f-fa32-4fb1-970e-eb3daf0a2618	67	9da12d1228351b8eef7cf4c6eb67d21d58633527c5c8dd51239328a236b75b5d	f	e9e86e37-cb18-47b3-9f22-ee8c668a2694	\N	2025-09-08 18:00:18.415827+03	2025-09-15 18:00:18.415827+03
e9e86e37-cb18-47b3-9f22-ee8c668a2694	67	302167def79ad5181312cf2b1186b11bf131bdbfd9dd2e28d9f2937ee7535df1	t	dc64d562-6caf-4cbe-ac13-725e40aa3370	c540a54f-fa32-4fb1-970e-eb3daf0a2618	2025-09-08 17:59:49.497156+03	2025-09-15 17:59:49.497156+03
1fa98a6c-74a7-4793-92f9-a7d24c79f395	67	000b36b194e855885a8c007fbb029accf5824fe27b2190aa2f01a888132ab939	t	\N	81e598a6-4b2e-474b-a775-40a32cc7cc31	2025-09-08 18:20:25.927835+03	2025-09-15 18:20:25.927835+03
5c972910-e1fd-4867-81ce-533a0b35060e	67	0e57d3108f270b68cca3c1f9fa8f41f821c29637275ea6be3c8680191f43d281	f	c85c7539-40bc-409f-998d-a369d54a2321	\N	2025-09-08 18:02:54.290535+03	2025-09-15 18:02:54.290535+03
c85c7539-40bc-409f-998d-a369d54a2321	67	271c43a40b4be560e25aec887464dafebe3684209776fd76bd2f9f9c962bee54	t	\N	5c972910-e1fd-4867-81ce-533a0b35060e	2025-09-08 18:01:54.347299+03	2025-09-15 18:01:54.347299+03
b8cd96bd-2668-438e-bf38-61a3b5509570	67	497ca1f62f91149a204333478f4ed473d189a8ff279a8e1e98ec7f3f8a6c05c5	t	\N	34fcde6e-cdea-4a3d-b18b-6d26da3c5d67	2025-09-08 18:03:25.814139+03	2025-09-15 18:03:25.814139+03
81e598a6-4b2e-474b-a775-40a32cc7cc31	67	c4b639e20352e0473b8c840508d8567792c1ad3812dfaaeaa90302e4367ea03a	t	1fa98a6c-74a7-4793-92f9-a7d24c79f395	c9e2a366-edb8-4f77-8ad7-671b9684df4a	2025-09-08 18:20:29.267758+03	2025-09-15 18:20:29.267758+03
87ca19d8-67a0-4d05-825e-98eb5c32e1a6	67	d64ec9f03375e4f42f99a4b13b52fb45c04508bf595720e93f9dd78c9cbb38ff	t	e6ee803a-829b-4ba9-aa32-dbfa11b983c9	c3e7ae82-5e74-4687-81c9-af5b38d9b651	2025-09-08 21:55:29.642616+03	2025-09-15 21:55:29.642616+03
c9e2a366-edb8-4f77-8ad7-671b9684df4a	67	23f590878d89f8ee1f12707dfd42d9f8e3e92d3dd654cfdd60ccd529b70a8491	t	81e598a6-4b2e-474b-a775-40a32cc7cc31	04ef56f6-34d5-46c3-a78d-fe1991e8b05a	2025-09-08 21:53:53.229367+03	2025-09-15 21:53:53.229367+03
43edc58d-f654-4646-bc16-b4e49d64f1fc	67	47885788bd9ec16b2e92e4ac917708308ce7f3cf59f66d01eb1010a011f40c2e	t	\N	\N	2025-09-08 22:05:27.573571+03	2025-09-15 22:05:27.573571+03
04ef56f6-34d5-46c3-a78d-fe1991e8b05a	67	7eac9d5b783a82a906b2a8dbebde28f64182d4946044d4efe63a247e139c6e19	t	c9e2a366-edb8-4f77-8ad7-671b9684df4a	1c3e37e1-48a1-45f4-9532-1f3ac9f75f96	2025-09-08 21:54:10.901198+03	2025-09-15 21:54:10.901198+03
1c3e37e1-48a1-45f4-9532-1f3ac9f75f96	67	4128240331273ff55636ac8c0db696dadd654078aad9cc823bd4040f32b1e006	t	04ef56f6-34d5-46c3-a78d-fe1991e8b05a	\N	2025-09-08 21:54:36.555723+03	2025-09-15 21:54:36.555723+03
8ccfc932-afd1-4d48-984c-f8eb662954ba	67	eb1953fa8d72b214c51baefeb43a24e5e32e320e1be1e9bb70f25a642003447a	f	c3e7ae82-5e74-4687-81c9-af5b38d9b651	\N	2025-09-08 21:56:49.305196+03	2025-09-15 21:56:49.305196+03
c3e7ae82-5e74-4687-81c9-af5b38d9b651	67	5a3c2e17b447fa82e9b48ce1f7ae149838fd84a5f32f720b572da032200d5a54	t	87ca19d8-67a0-4d05-825e-98eb5c32e1a6	8ccfc932-afd1-4d48-984c-f8eb662954ba	2025-09-08 21:55:47.140539+03	2025-09-15 21:55:47.140539+03
cab517fe-36eb-4b5f-a99e-2fb8878561dc	67	3c7d7fa5e3d778f93c3c51f6ced423ee25728c46bf120d0440455337a5b3fafa	t	\N	ee232c40-2849-4075-8265-e3494f6e8e8d	2025-09-08 21:58:03.376955+03	2025-09-15 21:58:03.376955+03
d4fdb3cf-c93e-41f7-a76f-9daf2f1acb5f	67	63177529542efd2428e16942219cd690b47a8197cb6bd39e4bde3a370f27153d	t	\N	d689231e-ef16-46b8-af48-f028fb9b677d	2025-09-08 22:01:19.842163+03	2025-09-15 22:01:19.842163+03
d689231e-ef16-46b8-af48-f028fb9b677d	67	3e2f0dd8d7f2f90e62b01c4508f3d50e41b26d6ffab888151db7a5158df43c40	t	d4fdb3cf-c93e-41f7-a76f-9daf2f1acb5f	\N	2025-09-08 22:01:22.448848+03	2025-09-15 22:01:22.448848+03
25b6dbb8-fcc3-427e-96f1-bfba8b4818fa	67	56568eca1d90a0f80aedd3a81137b13c182a04db1eaa4224869f7206c15459a4	t	\N	\N	2025-09-08 22:04:11.599014+03	2025-09-15 22:04:11.599014+03
bb6d46dd-8243-4fb2-89dc-1990a6d1b48f	67	6e5400197cca7368768113023f899fe4bf29f7d54307b095540d64d444611969	t	\N	\N	2025-09-08 22:09:00.14038+03	2025-09-15 22:09:00.14038+03
84a1e927-fbaf-4f6f-98d7-fc7f7ef17fb2	67	5f05653508add0d7533ce815263032fe92547c081856cf28eb03bf3b0fdde7f6	t	da67ae05-672c-40e8-834f-f81323864939	\N	2025-09-08 22:28:15.041264+03	2025-09-15 22:28:15.041264+03
da67ae05-672c-40e8-834f-f81323864939	67	25e9ff0852b7db9ee2171deaf7548698363be22b45800e85889a5a70bf8c0758	t	\N	84a1e927-fbaf-4f6f-98d7-fc7f7ef17fb2	2025-09-08 22:11:26.49661+03	2025-09-15 22:11:26.49661+03
5526dbb4-1313-4669-ada6-a0334245aba7	67	dd2b069ccdc64f26850b96bcaf1d6b0c9aa6c469407b1250fa0a4fcc5fbe2c44	t	\N	\N	2025-09-08 22:41:50.388557+03	2025-09-15 22:41:50.388557+03
ea2d340d-eabe-4ae3-b21b-9b9173ae14cc	67	8624e72efefa78f712f7be2d976559b20639a9bdcc786f7852f9c8715c52a6ad	t	\N	9ee8e16b-16a5-415f-a779-5790a2c3b48c	2025-09-08 22:49:53.915252+03	2025-09-15 22:49:53.915252+03
9ee8e16b-16a5-415f-a779-5790a2c3b48c	67	a042fcb226c69106ea4834948f3d82b583cf7ee614e30dac5ed1c4beefa0d6ea	t	ea2d340d-eabe-4ae3-b21b-9b9173ae14cc	eff8f172-7b39-47e1-87c1-894352f30902	2025-09-08 23:04:53.057927+03	2025-09-15 23:04:53.057927+03
d3a56875-576c-4bdc-b126-599d5f934653	67	91767dfb5198f21e7d92ae8ca84793f1c7a0eb805cef253da5af2942ccbe913c	t	eff8f172-7b39-47e1-87c1-894352f30902	76fed5a1-423b-40f1-ab63-b7a648d2eef8	2025-09-08 23:34:53.048988+03	2025-09-15 23:34:53.048988+03
785133f6-3fe6-4d24-afb6-015936380406	67	b867dc7f5b7e04a85acee4a29e5043dedf6e29645ec1948a47e6751a24fe65a8	t	\N	\N	2025-09-10 12:53:16.608466+03	2025-09-17 12:53:16.608466+03
04b6d306-d6a1-4191-800e-b5bb5b6dc144	67	0eb44cf696842d76c670acdf42110656b7c74a53ddc9c803d3b30f6586c6e7b8	t	\N	\N	2025-09-10 21:40:13.432387+03	2025-09-17 21:40:13.432387+03
eff8f172-7b39-47e1-87c1-894352f30902	67	996246a16df862c28269c11b8ff9b6e3e11c6e076331e312614ac23ee8e8cbb7	t	9ee8e16b-16a5-415f-a779-5790a2c3b48c	d3a56875-576c-4bdc-b126-599d5f934653	2025-09-08 23:19:53.051324+03	2025-09-15 23:19:53.051324+03
c36db7ba-dca1-488f-9619-44ab2a6052f7	67	cd028cba2fd66518410e54f1630323ccda2dd27625b4443af0de7b3a4eaa3408	t	f8387186-abfe-4844-87fe-2f9d667af14c	e7421c30-2823-4d40-82ec-fe60476ea394	2025-09-09 15:09:29.426522+03	2025-09-16 15:09:29.426522+03
76fed5a1-423b-40f1-ab63-b7a648d2eef8	67	9535ab620393ceb1e7ae98eb9e0d6285d8ccc56696f3047e04191527559ec3c4	t	d3a56875-576c-4bdc-b126-599d5f934653	1cec0d1b-5ae1-486b-a26d-519f2a05f322	2025-09-08 23:49:53.099891+03	2025-09-15 23:49:53.099891+03
97a42f4e-975a-4c6a-b3ed-31294ba5d7e1	67	b367b0eb5180cc53b261eeeb1006bea708b1dedb0117c5ea81d4d019d2904390	t	48411d22-7d81-4d1d-8484-7466b4e15dae	8b5b2808-3015-432d-81da-4b7ee8324f29	2025-09-09 17:05:09.040932+03	2025-09-16 17:05:09.040932+03
1cec0d1b-5ae1-486b-a26d-519f2a05f322	67	978ee49407d81d99eba917adef926361532e7250e6cf2c2a86b21b85cc78123d	t	76fed5a1-423b-40f1-ab63-b7a648d2eef8	31ca7c5b-08a6-4651-b394-16c4827be5a9	2025-09-09 00:04:53.041621+03	2025-09-16 00:04:53.041621+03
31ca7c5b-08a6-4651-b394-16c4827be5a9	67	8f03e9661200ede72df5b7ba2ef3e6da94506f59b71c60ed07a180c19209b279	t	1cec0d1b-5ae1-486b-a26d-519f2a05f322	ab6fd856-1525-4d59-9b86-f53d20c10660	2025-09-09 00:19:53.034345+03	2025-09-16 00:19:53.034345+03
e7421c30-2823-4d40-82ec-fe60476ea394	67	075482017feb77acabfeabf6e934c54e28ab1ab224e54a49852b73380dbe97af	t	c36db7ba-dca1-488f-9619-44ab2a6052f7	5425c965-7fb8-48d7-a83c-0671909f8e3b	2025-09-09 15:24:29.061942+03	2025-09-16 15:24:29.061942+03
ab6fd856-1525-4d59-9b86-f53d20c10660	67	739b1d1bb08eb85ebeca4ae123f69e1afa3d822f0da0e27d9cfc651921617fee	t	31ca7c5b-08a6-4651-b394-16c4827be5a9	cdcb1faa-66a0-4698-9414-8e14eb622c72	2025-09-09 00:58:06.816501+03	2025-09-16 00:58:06.816501+03
83fcf298-6b3b-4905-983f-78b8b18ee04c	67	d66744dd7ba79b0630090ea0b02037fd3d75dcccb0705a3068201b917b488e2f	t	\N	1ec64266-b011-4d75-b1ed-5afb88cd199f	2025-09-09 19:06:02.848235+03	2025-09-16 19:06:02.848235+03
cdcb1faa-66a0-4698-9414-8e14eb622c72	67	274c349b44a135cb4abc0adc21db76b7e2ed01e480ff88f6c67896345009bb84	t	ab6fd856-1525-4d59-9b86-f53d20c10660	9e6bce4c-102e-489a-a237-1ecc5bd7b18a	2025-09-09 01:13:06.0204+03	2025-09-16 01:13:06.0204+03
9e6bce4c-102e-489a-a237-1ecc5bd7b18a	67	d58fa689035f5ecf2d57111b14f7435ba4b5cb9387cdb809e35ae6fb7d2963ce	t	cdcb1faa-66a0-4698-9414-8e14eb622c72	466bda45-4bf6-437c-8c0d-a04042a9552a	2025-09-09 01:28:06.016975+03	2025-09-16 01:28:06.016975+03
5425c965-7fb8-48d7-a83c-0671909f8e3b	67	dd97f1092cd132ecc7296810b5f1dd72f1187b540caa974a4d65917bc6b923b7	t	e7421c30-2823-4d40-82ec-fe60476ea394	d70f4290-1096-4e1b-83eb-9eb63ccf56f6	2025-09-09 15:39:54.113844+03	2025-09-16 15:39:54.113844+03
466bda45-4bf6-437c-8c0d-a04042a9552a	67	a0133b7c8fd5dbfb2108860dd9325204213b2af80a1cb76852ad568d44015bac	t	9e6bce4c-102e-489a-a237-1ecc5bd7b18a	8ec16e8e-6065-4f70-aa1e-55986646ee82	2025-09-09 01:43:06.017051+03	2025-09-16 01:43:06.017051+03
8ec16e8e-6065-4f70-aa1e-55986646ee82	67	494c151a3c2f0fc7c7d0ca5b9ecc40fe27b019974fb08f7955c42f342a18feb7	t	466bda45-4bf6-437c-8c0d-a04042a9552a	5132c4b5-bd1e-44f3-a1f6-25db97bd9539	2025-09-09 01:58:06.028718+03	2025-09-16 01:58:06.028718+03
5132c4b5-bd1e-44f3-a1f6-25db97bd9539	67	c8e18fadc384042997e60b2e69f9ad3366388a1ace919a35c8516357b723d58b	t	8ec16e8e-6065-4f70-aa1e-55986646ee82	adb2efe8-1acc-4102-93d8-25b8aebbd817	2025-09-09 02:13:06.033253+03	2025-09-16 02:13:06.033253+03
d70f4290-1096-4e1b-83eb-9eb63ccf56f6	67	563d15dfdea8cbc5771e9bb47ca85ab495b5ea06f94d49aceca05befc02b7450	t	5425c965-7fb8-48d7-a83c-0671909f8e3b	71580bd1-c3ff-44ca-903d-54d7f22bdbba	2025-09-09 15:57:56.330389+03	2025-09-16 15:57:56.330389+03
adb2efe8-1acc-4102-93d8-25b8aebbd817	67	292bf9c3936181fcd5003fff6d3c3a0790194bf915e8ca995b1c8c46568d7afa	t	5132c4b5-bd1e-44f3-a1f6-25db97bd9539	ea82bc1f-8306-49e7-86d2-86143e2fc244	2025-09-09 02:31:57.578636+03	2025-09-16 02:31:57.578636+03
71580bd1-c3ff-44ca-903d-54d7f22bdbba	67	0b20e9449f9455d143356c87b30229c85a62b2ec44c34a26b137505a9dcf3efa	t	d70f4290-1096-4e1b-83eb-9eb63ccf56f6	\N	2025-09-09 16:12:57.970394+03	2025-09-16 16:12:57.970394+03
6b934d44-9565-445e-bd83-b2ad7757375e	67	55af6670bc6c3a1b1dd5587675f8762cf6cadc8f4483c22ce6bd2f6b6990dd27	t	\N	af9a9a80-7c97-4fcb-8d6d-892bf0e8f1a8	2025-09-09 13:16:28.644716+03	2025-09-16 13:16:28.644716+03
af9a9a80-7c97-4fcb-8d6d-892bf0e8f1a8	67	570cce6feea9ddcbea922ba43d3442234fb0074e42740d06e249397cfc3bd435	t	6b934d44-9565-445e-bd83-b2ad7757375e	9655b648-0e37-43a0-a718-cf6c981896ce	2025-09-09 13:33:29.179584+03	2025-09-16 13:33:29.179584+03
8b5b2808-3015-432d-81da-4b7ee8324f29	67	37eb574b925e23b942762af672cf3ef707dae0be91b6acc1b2b9f77b66a66e68	t	97a42f4e-975a-4c6a-b3ed-31294ba5d7e1	c45211eb-bf54-4cb7-8548-ad41294e9ac3	2025-09-09 17:20:09.315307+03	2025-09-16 17:20:09.315307+03
9655b648-0e37-43a0-a718-cf6c981896ce	67	946e4bde8b6aa2e136ec306955bdf9d330c8aa8b9d32481df2fcd2de6160c587	t	af9a9a80-7c97-4fcb-8d6d-892bf0e8f1a8	6aa46937-5642-402d-b379-eee2e673ae95	2025-09-09 13:49:14.712224+03	2025-09-16 13:49:14.712224+03
0a674533-0230-48e3-a481-2e62129aba4a	67	d8ad6ae97aaa52a13d92988eb93eb87a9a7e47b95e5a371cdcf5cd761ce4083e	f	ff2b0ff3-7978-479a-a4fe-c9868e76ee29	\N	2025-09-09 16:34:30.610976+03	2025-09-16 16:34:30.610976+03
6aa46937-5642-402d-b379-eee2e673ae95	67	d664a039406e3f8f5566c9f6fa89d94c985a5733d35ae8073616bc593bb2b65b	t	9655b648-0e37-43a0-a718-cf6c981896ce	f8387186-abfe-4844-87fe-2f9d667af14c	2025-09-09 14:24:27.853084+03	2025-09-16 14:24:27.853084+03
ff2b0ff3-7978-479a-a4fe-c9868e76ee29	67	da83c6fb97a5d29c83287102114a1bff4f087020446e6fd1d9cb808f3b34de3b	t	\N	0a674533-0230-48e3-a481-2e62129aba4a	2025-09-09 16:18:00.536229+03	2025-09-16 16:18:00.536229+03
f8387186-abfe-4844-87fe-2f9d667af14c	67	43fb45d5da279f0335542c2a798f305e449249a7463139b195975610947338f0	t	6aa46937-5642-402d-b379-eee2e673ae95	c36db7ba-dca1-488f-9619-44ab2a6052f7	2025-09-09 14:39:27.066777+03	2025-09-16 14:39:27.066777+03
20467919-d8c6-4845-896e-ba6ce02e8edd	67	d642738bce33557875f5e3eb774f4d72895ad94dcf7a33e7f02509e54c595c33	t	\N	48411d22-7d81-4d1d-8484-7466b4e15dae	2025-09-09 16:35:09.639588+03	2025-09-16 16:35:09.639588+03
c45211eb-bf54-4cb7-8548-ad41294e9ac3	67	e2339a0016b8fb4c46b773e007a55caf83a5c0b8bcd2edbb63e51adbff44b161	t	8b5b2808-3015-432d-81da-4b7ee8324f29	51c2a233-3186-44c6-a30a-c1ba6a8eaef1	2025-09-09 17:35:09.13758+03	2025-09-16 17:35:09.13758+03
48411d22-7d81-4d1d-8484-7466b4e15dae	67	6d9d20b7a1826d0a38ef3fb08d7f7cc7efb5d02b9a552c134bcfa623747cabb5	t	20467919-d8c6-4845-896e-ba6ce02e8edd	97a42f4e-975a-4c6a-b3ed-31294ba5d7e1	2025-09-09 16:50:09.048125+03	2025-09-16 16:50:09.048125+03
618f13cf-5032-43a4-9577-6491e17551e3	67	3982f8675129f6ef6dd323a8479edab60f596944ca396510d2ef5de7114a2197	t	\N	180264f7-4813-472e-8af3-e703e10fa203	2025-09-09 18:20:25.393429+03	2025-09-16 18:20:25.393429+03
51c2a233-3186-44c6-a30a-c1ba6a8eaef1	67	6e766906c662eff55a3157d4c3095d28e1f84c9944749f8493db679c4d3690b5	t	c45211eb-bf54-4cb7-8548-ad41294e9ac3	a2a934eb-c945-4b25-9ec5-edbb2771cbe7	2025-09-09 17:35:09.227966+03	2025-09-16 17:35:09.227966+03
9fdbdef7-3bf3-46f5-aa1e-e6103562c7a1	67	474f29dc8c544a3afc1acf59c30906962d166f569b262130e0ff9b04f65965a4	f	97a42f4e-975a-4c6a-b3ed-31294ba5d7e1	\N	2025-09-09 17:20:09.310523+03	2025-09-16 17:20:09.310523+03
76fb0384-6ef3-45a2-bac8-4c55940878df	67	10ecc0323fe53064356a3e65b0228d40d63ca03149fe6f9e2d4303de56213e0f	f	97a42f4e-975a-4c6a-b3ed-31294ba5d7e1	\N	2025-09-09 17:20:09.313076+03	2025-09-16 17:20:09.313076+03
858f9ed2-78c7-47ad-8d34-da5722b1845e	67	29baba6bc5631a07a2a6824e5ccc956b323bf0e8b13631b46ec445003d549a3b	t	1ec64266-b011-4d75-b1ed-5afb88cd199f	a44cc58c-3948-47a3-a5ad-ae1b9de9754d	2025-09-09 19:46:07.929413+03	2025-09-16 19:46:07.929413+03
a2a934eb-c945-4b25-9ec5-edbb2771cbe7	67	17ec84b9f30d13d06f5bda3a99817ab36d83ddd8fb02c336bfc2208e5f2aa270	t	51c2a233-3186-44c6-a30a-c1ba6a8eaef1	46ceee38-a6d3-4a65-9ca4-f4f9fdb2d36d	2025-09-09 17:50:09.04785+03	2025-09-16 17:50:09.04785+03
180264f7-4813-472e-8af3-e703e10fa203	67	56badcd30271c57fb83194ac0a5a7796722b49ea97f202cd8196b6a2e6d3eaa6	t	618f13cf-5032-43a4-9577-6491e17551e3	692e5812-e931-464a-b526-707671e283ea	2025-09-09 18:35:25.054134+03	2025-09-16 18:35:25.054134+03
64bb44bb-60be-4b05-b090-ce0e9ec7b5d9	67	6721670a9d2861272432fb5b3963a697000999437098437bd4755e8e7c993688	f	46ceee38-a6d3-4a65-9ca4-f4f9fdb2d36d	\N	2025-09-09 18:20:09.149514+03	2025-09-16 18:20:09.149514+03
46ceee38-a6d3-4a65-9ca4-f4f9fdb2d36d	67	086e8b0a726b2c5abb9bcaefbaf26eac1632ba799965407413a89579c554bbfb	t	a2a934eb-c945-4b25-9ec5-edbb2771cbe7	64bb44bb-60be-4b05-b090-ce0e9ec7b5d9	2025-09-09 18:05:09.240853+03	2025-09-16 18:05:09.240853+03
3fba70f0-eadc-4490-8744-513caaacf8c3	67	051e44089a96d23b19b34b9899f741e6f9fadcbc9dee39e0db854e7d3f36231d	f	692e5812-e931-464a-b526-707671e283ea	\N	2025-09-09 19:05:45.251606+03	2025-09-16 19:05:45.251606+03
692e5812-e931-464a-b526-707671e283ea	67	ed2599e3202626d1a8b343a894d9079287ff8ea88247d8cafbfc0b0174d642d0	t	180264f7-4813-472e-8af3-e703e10fa203	3fba70f0-eadc-4490-8744-513caaacf8c3	2025-09-09 18:50:25.045278+03	2025-09-16 18:50:25.045278+03
a44cc58c-3948-47a3-a5ad-ae1b9de9754d	67	aac8cfe3d50a00d922ed3665b85bcd585637f319f800bed951c0a3bc8adab355	t	858f9ed2-78c7-47ad-8d34-da5722b1845e	\N	2025-09-10 02:51:46.23427+03	2025-09-17 02:51:46.23427+03
1ec64266-b011-4d75-b1ed-5afb88cd199f	67	7773f784e581d829a96c6f1be4d93b51475167efdf187d837db6b6a2b7ce05fd	t	83fcf298-6b3b-4905-983f-78b8b18ee04c	858f9ed2-78c7-47ad-8d34-da5722b1845e	2025-09-09 19:21:02.072484+03	2025-09-16 19:21:02.072484+03
92891869-ea7c-47c3-8a42-9bfa159ed884	67	d2fd768513325c6cdc07bb82b2de8519e92fae916f535bba1986e87ca815b007	t	\N	\N	2025-09-10 02:57:59.752856+03	2025-09-17 02:57:59.752856+03
7309a0b6-9bf6-4775-bc5e-7afcee0efc90	67	6a8744e764ea7398e1dabafe1ed16de714344eb80041df3577478b7bf9ac4464	t	ea82bc1f-8306-49e7-86d2-86143e2fc244	\N	2025-09-10 12:48:56.036381+03	2025-09-17 12:48:56.036381+03
00651a99-315e-446e-b52e-17f7b20f0d55	67	8b4f08834c8b49cbd8524e67579319b20e3284e16663618afd20642ff52c696f	t	\N	aaa98405-1795-4480-a6bc-e14756273eb2	2025-09-10 03:03:48.661497+03	2025-09-17 03:03:48.661497+03
aaa98405-1795-4480-a6bc-e14756273eb2	67	ce00b2c874d6d33270b40426182f48ab10cd26f0ba47dc1f6d51986fc8e9bfb9	t	00651a99-315e-446e-b52e-17f7b20f0d55	523677eb-81cc-4eb9-964b-5f6b4902a527	2025-09-10 03:57:52.674838+03	2025-09-17 03:57:52.674838+03
523677eb-81cc-4eb9-964b-5f6b4902a527	67	70210da8fc9731a98ec0bb901791b99a2e6945c25f6b4f4cfa0cccbd5f750fb1	t	aaa98405-1795-4480-a6bc-e14756273eb2	750e53fe-5351-429f-aaa1-575f825447ec	2025-09-10 04:15:29.756163+03	2025-09-17 04:15:29.756163+03
ea82bc1f-8306-49e7-86d2-86143e2fc244	67	6abde1983324d1eece9f1d28e8a703a7692745d59b5f69e3b13965c05584759c	t	adb2efe8-1acc-4102-93d8-25b8aebbd817	7309a0b6-9bf6-4775-bc5e-7afcee0efc90	2025-09-09 02:48:26.130577+03	2025-09-16 02:48:26.130577+03
750e53fe-5351-429f-aaa1-575f825447ec	67	bb86e03ad1a50011b47879fa0d620bb63c6cbba34132c37a2ead949c6586ee67	t	523677eb-81cc-4eb9-964b-5f6b4902a527	332d7875-d32e-4e5b-9a23-a1b8ba021cc9	2025-09-10 04:34:03.462362+03	2025-09-17 04:34:03.462362+03
114b898c-4202-494d-808a-a45fba5c80a1	67	f8e2eb1092360d6029c565db3e80e463ac8a59f842c2b29768370d1ef159d8b3	t	69e01cd9-25ab-435f-bb3c-b352933ee721	41c60694-fc40-4975-a16c-fb9405b42527	2025-09-11 04:12:10.625688+03	2025-09-18 04:12:10.625688+03
87f02242-63c7-4a2f-9e8d-fd4dd594986a	67	8008e9ea1eb34be14d3b1b02cd95683970900592267fee711c17c4b23960cd95	t	\N	6e2c8fec-5470-46a8-b68d-d3a814c86968	2025-09-10 21:50:49.288889+03	2025-09-17 21:50:49.288889+03
6e2c8fec-5470-46a8-b68d-d3a814c86968	67	fd574ce816ad88f903c4dfaf3f79c1c3d2dbb336ab96255c3977e0a834621400	t	87f02242-63c7-4a2f-9e8d-fd4dd594986a	da52de89-f4c1-4010-953c-763437aa7958	2025-09-10 22:05:51.072033+03	2025-09-17 22:05:51.072033+03
d201e2f7-079a-4ac3-8d40-165c350c8e61	67	6945c5c36bee8c62447f26853717710ea410b56715bf3ce0ccd085ec1370b249	t	\N	87ca481b-4e07-4a70-99d5-a3f6a78e513d	2025-09-11 01:17:37.476504+03	2025-09-18 01:17:37.476504+03
da52de89-f4c1-4010-953c-763437aa7958	67	8053bf6fa6b3abcacc808599902ff76818a84c87cc15125090092c7a09195d4c	t	6e2c8fec-5470-46a8-b68d-d3a814c86968	ba5d39fe-50bb-49ba-bd17-2ac36012fc17	2025-09-10 22:21:44.864318+03	2025-09-17 22:21:44.864318+03
87ca481b-4e07-4a70-99d5-a3f6a78e513d	67	17a4824bfe1c6cf934c71a24c6124e6f908ae98ac7c1b802b6c63aeb1976d113	t	d201e2f7-079a-4ac3-8d40-165c350c8e61	\N	2025-09-11 01:32:50.637504+03	2025-09-18 01:32:50.637504+03
ba5d39fe-50bb-49ba-bd17-2ac36012fc17	67	80aa9814161d7ea327ef52a7cf5cd2b739ad012cd242a2e9fef5585afb2b25e0	t	da52de89-f4c1-4010-953c-763437aa7958	7b3f2d0a-776c-4a78-88a1-508a979ee32c	2025-09-10 22:36:54.348409+03	2025-09-17 22:36:54.348409+03
7b3f2d0a-776c-4a78-88a1-508a979ee32c	67	6c830657024a8fc21e5b2fd6aa8b295b219b3dfd2e515222901c037ace6fb6ad	t	ba5d39fe-50bb-49ba-bd17-2ac36012fc17	43394162-c1c7-43e4-bba0-a3878eb22bf0	2025-09-10 22:51:54.115119+03	2025-09-17 22:51:54.115119+03
37d088b2-e842-45f8-8336-e4e5d6543794	67	f23486d90021fe227112256d6d558b2d5c359e6309318821e930cb9863d9849b	t	\N	\N	2025-09-11 01:33:15.870383+03	2025-09-18 01:33:15.870383+03
43394162-c1c7-43e4-bba0-a3878eb22bf0	67	30039ac7c7eae9d509a1e6d0b8ed520b09aa5a51e76f1a9c97c55d0ed61b8b08	t	7b3f2d0a-776c-4a78-88a1-508a979ee32c	d8f66ae5-5c84-4733-91c6-cff320dfca05	2025-09-10 23:08:01.800735+03	2025-09-17 23:08:01.800735+03
8ef3c411-0ca2-42fb-bb25-72f6179700c1	67	d48b3b124c9aedb82b0972180cf09ad97b63c7fbb7e472ce4298199d1b648667	f	d8f66ae5-5c84-4733-91c6-cff320dfca05	\N	2025-09-10 23:38:50.120791+03	2025-09-17 23:38:50.120791+03
d8f66ae5-5c84-4733-91c6-cff320dfca05	67	6af3715acb236028273aa9f630ad90412c51bab438bc77d2475518e502db4af0	t	43394162-c1c7-43e4-bba0-a3878eb22bf0	8ef3c411-0ca2-42fb-bb25-72f6179700c1	2025-09-10 23:23:50.430208+03	2025-09-17 23:23:50.430208+03
eba7898b-216e-4cfe-b884-2cd1b2e561f4	67	dbbdf8430a433a54a77288780e4ced1695cc12200ab6b05a039a7bb4dfdf92ca	t	\N	\N	2025-09-11 01:34:14.443428+03	2025-09-18 01:34:14.443428+03
1848b1bc-fe49-43df-b793-26efe1af7dd1	67	4ef4b7a55c632c67f99ca7a8a7c896864b7b9f17ed95978463472c53cece8cfe	t	\N	e3c6335d-8291-49d5-b3e8-4525e5998429	2025-09-10 23:41:30.828161+03	2025-09-17 23:41:30.828161+03
5bf29592-63aa-4dcf-99d7-d8195b64730b	67	3a7f2694bf55af8af1653378659ec02ca91f37e3c203d04a7567d5a7ad11dfa7	f	e3c6335d-8291-49d5-b3e8-4525e5998429	\N	2025-09-11 00:11:30.092209+03	2025-09-18 00:11:30.092209+03
e3c6335d-8291-49d5-b3e8-4525e5998429	67	e0803e9bc4858f12ef65a759330f290d11dd9f61b8389d353f018185b3d6a064	t	1848b1bc-fe49-43df-b793-26efe1af7dd1	5bf29592-63aa-4dcf-99d7-d8195b64730b	2025-09-10 23:56:30.041398+03	2025-09-17 23:56:30.041398+03
4592d8d4-15e4-43ba-97f6-b6f15ba1f822	67	fc64e8f9a6fe9b8bf367083ee7b3de206b59511be2b96d02b10cd2c16c624b43	t	\N	\N	2025-09-11 00:11:52.574921+03	2025-09-18 00:11:52.574921+03
c0964b95-0dbd-4efc-8a89-9841b2f6622e	67	a0bafd90d586be322c255fa38330c2da8c845ccf0caa820de33c486bd383486d	t	\N	\N	2025-09-11 00:22:59.979317+03	2025-09-18 00:22:59.979317+03
a7cc2984-03a7-4992-b1b2-b49fd5b05b03	67	be64f6a808789f08d15f5b30d622e297f4a43dd4064943fb492fce0b189c4a8f	t	\N	\N	2025-09-11 00:26:30.166038+03	2025-09-18 00:26:30.166038+03
6b87ecc0-986d-45a4-82a6-fc6f19416409	8	737b69519a5548671fce43d9150d72a69019f8d692408e89f96dfbc793a40690	t	\N	\N	2025-09-11 00:28:13.585951+03	2025-09-18 00:28:13.585951+03
54b43723-8c40-468f-87f7-1b0c2c3af6fe	67	e4ebca000f42ec01f7b7fe872600a652dfbac340975d3d5294216f04c704760c	t	\N	\N	2025-09-11 01:47:16.456353+03	2025-09-18 01:47:16.456353+03
ec144e8a-d91d-487b-8c4e-8fb02fbfbadf	8	f51a4ccdd3dffa1fcef9117b629b0c60e783cf381fe3567727168810cceb6463	t	\N	8f254f93-89cd-4656-9d1a-abe8bf704088	2025-09-11 00:33:50.24083+03	2025-09-18 00:33:50.24083+03
8f254f93-89cd-4656-9d1a-abe8bf704088	8	372482f579ac1822c2189cc0d057a6346e2eddef95d7a1e4352e6099d7c5e1f5	t	ec144e8a-d91d-487b-8c4e-8fb02fbfbadf	\N	2025-09-11 01:02:15.39742+03	2025-09-18 01:02:15.39742+03
293f9ada-9b34-418e-bf6a-cedb1b16f8ab	67	41185c411854ffe5862c5feb95a414ce364744f25bbde0b397007716b5413d61	t	\N	\N	2025-09-11 01:03:07.00482+03	2025-09-18 01:03:07.00482+03
1df84eda-5ddd-4e4b-9691-cab80c947cf3	67	95db4984b69abf26a9b14bdbef97cb81d6ee6527460a8256d45bdc74bc9d33b6	t	\N	\N	2025-09-11 01:04:27.861832+03	2025-09-18 01:04:27.861832+03
e232f835-bc6d-4e16-a5ce-bdf24b6df7fe	67	dc8d8b56fe7ab936707fc74d331ea8ed01a10b049003a7f18d31f8e3aa386080	t	\N	\N	2025-09-11 01:09:17.666417+03	2025-09-18 01:09:17.666417+03
bbbfbfb6-7431-4cea-b9a0-5eaff3778779	67	9006ca7533beb390700f418d6b6c75e1a2d7be66a784fc53d96bc86b0462fba5	t	\N	\N	2025-09-11 01:13:05.29505+03	2025-09-18 01:13:05.29505+03
e6950d73-4f94-4482-ac5a-31ee6b88134c	67	134663738254e0942162592deed048c4e724888dfd56b0623b40425fb0e208f9	t	\N	\N	2025-09-11 01:15:41.395557+03	2025-09-18 01:15:41.395557+03
cb55b8da-aa90-4906-a569-03ad88e28ab1	67	1218b0ed60f600ad484197052ead5e1eb67a5541f8ca2736ffb590d4248159ee	t	\N	\N	2025-09-11 01:48:39.463647+03	2025-09-18 01:48:39.463647+03
0517561e-9fb9-49a2-ba56-1194ed676eb6	67	e1d980e71d5fcf2aa69c5696aecf2be620d0ddff1a6e1da2cedcfc050b1620fc	t	\N	933dc8b7-4e47-4920-9044-95cd5fbcb8ee	2025-09-11 01:55:45.067435+03	2025-09-18 01:55:45.067435+03
933dc8b7-4e47-4920-9044-95cd5fbcb8ee	67	7944c7b5b899505aece6882742328090cd5f40bbb5ebcadf1d96ffa7bbf79dc3	t	0517561e-9fb9-49a2-ba56-1194ed676eb6	\N	2025-09-11 02:13:38.84571+03	2025-09-18 02:13:38.84571+03
bf2f6a60-fd01-4ec0-96ef-de4cb5be382a	67	9f865db63d6a6fab6a03d7d860d0a9b2a3c1ebabf4ed306f0b8058839ecfb4bf	t	\N	\N	2025-09-11 02:28:44.944535+03	2025-09-18 02:28:44.944535+03
0e1b2348-a9d0-42da-83e2-9015a3a9017a	67	f1672fb83e43e5cd83c87f0860399cd3df5889dbdbe28d6f2639f370504f9d9a	t	\N	\N	2025-09-11 02:48:04.151522+03	2025-09-18 02:48:04.151522+03
804c1039-dc89-4610-bc46-b51bab5154b4	67	c9f30fc112291f7f838a722942fd87ffa764f72b33e5a54d791651ed819e9b2d	f	\N	\N	2025-09-11 03:52:31.377669+03	2025-09-18 03:52:31.377669+03
cda22c8c-b75d-42fe-a5b5-64c8d2684789	67	93019e67d19db0b9dac0e7ba9988556c47852f72446d0da57cfad38fef31d4fe	t	1fbb0d79-35c8-45df-999a-d267185fd932	4ff803e9-d4f4-4eee-bab5-1c4bf5b04431	2025-09-11 12:49:35.266318+03	2025-09-18 12:49:35.266318+03
69e01cd9-25ab-435f-bb3c-b352933ee721	67	1c8d63cadf2f0ebea3e5b995697cc45be6678d59cfbc915873814efef0ddf730	t	\N	114b898c-4202-494d-808a-a45fba5c80a1	2025-09-11 03:55:08.98671+03	2025-09-18 03:55:08.98671+03
4b8bfdb7-161d-429b-a29d-8fbfd71fe840	67	daa761c821c379b9f73f885ca45a60a1ed325d5aeb9f3dab230d83d41d08ca74	t	\N	\N	2025-09-12 21:46:32.121507+03	2025-09-19 21:46:32.121507+03
41c60694-fc40-4975-a16c-fb9405b42527	67	a6d6d395d06096dc94e854fc2ec22c8f5dec981fac8a0f663b1bb5d34e9022a0	f	114b898c-4202-494d-808a-a45fba5c80a1	\N	2025-09-11 04:15:23.660693+03	2025-09-18 04:15:23.660693+03
1fbb0d79-35c8-45df-999a-d267185fd932	67	9445d9a1c163be3fbab52a04359c8599a74bc4f64810d108f9caf0c0ff0dcefd	t	\N	cda22c8c-b75d-42fe-a5b5-64c8d2684789	2025-09-11 04:18:31.877454+03	2025-09-18 04:18:31.877454+03
332d7875-d32e-4e5b-9a23-a1b8ba021cc9	67	71e838f432a43175cfa6cf8f4e9cf274dac950863530cfaffff64a0341f38413	t	750e53fe-5351-429f-aaa1-575f825447ec	33dcf0d3-0f26-4e9e-ab52-1c1875e4fa0b	2025-09-11 03:08:21.28733+03	2025-09-18 03:08:21.28733+03
33dcf0d3-0f26-4e9e-ab52-1c1875e4fa0b	67	ade4a375ec97b784fe682b159bd116e55433ed916f848ff8c755be6209791570	t	332d7875-d32e-4e5b-9a23-a1b8ba021cc9	\N	2025-09-12 12:08:28.802797+03	2025-09-19 12:08:28.802797+03
6ed9404b-00df-46db-bd92-ae4e7dec9b68	67	a60d60eaaad461183cdba48f42ba76bdabf282bf1fa06e93f7195531f97e118f	t	\N	\N	2025-09-12 13:53:28.184989+03	2025-09-19 13:53:28.184989+03
4ff803e9-d4f4-4eee-bab5-1c4bf5b04431	67	ab8361aff287164e54220632f6243509e7a13439c6ffd3e51756890999db5143	t	cda22c8c-b75d-42fe-a5b5-64c8d2684789	de358f49-ab9e-4034-b352-c7d704c0e389	2025-09-12 18:18:45.853846+03	2025-09-19 18:18:45.853846+03
de358f49-ab9e-4034-b352-c7d704c0e389	67	1042452c546cbf074bde3228d1aff2e36c393ef50764f5966d60bab0a572c3ed	t	4ff803e9-d4f4-4eee-bab5-1c4bf5b04431	52534d63-bdd7-49df-aab2-2b761ac8194e	2025-09-12 20:56:02.148757+03	2025-09-19 20:56:02.148757+03
52534d63-bdd7-49df-aab2-2b761ac8194e	67	e8bd999ba877d9bae4f18ebb9429368e3347562de4c1f2299decf1e08b5c76de	t	de358f49-ab9e-4034-b352-c7d704c0e389	\N	2025-09-12 21:39:43.70948+03	2025-09-19 21:39:43.70948+03
e7f912cc-79d3-419e-bd3c-a5e1ded6872a	67	9b90c514e4c4ca64d06549c7e340bfc22542c6eec894136f57e5cc948e620c6e	t	\N	12175a28-abf5-40ff-bd42-b3d764e8f7d6	2025-09-12 23:07:18.54486+03	2025-09-19 23:07:18.54486+03
12175a28-abf5-40ff-bd42-b3d764e8f7d6	67	cbfee3f11f9c538c1fe9c31ffd204f638d21d9dddc3aaffe512357f4036988af	t	e7f912cc-79d3-419e-bd3c-a5e1ded6872a	a18a9940-647c-4f05-96a6-b5ef93e87582	2025-09-12 23:41:53.26929+03	2025-09-19 23:41:53.26929+03
b0071aac-fedc-456c-9000-9cef802e87bc	67	b1c26e8a8402a2a5b2b2e6b390df1229cd1bd340705b5a4c8311cbb98b5e0fed	f	a18a9940-647c-4f05-96a6-b5ef93e87582	\N	2025-09-13 00:11:53.096025+03	2025-09-20 00:11:53.096025+03
a18a9940-647c-4f05-96a6-b5ef93e87582	67	a19517dada0e694e820842d4f8531a97c74a1f3fdfb895d55d830e3f5540113e	t	12175a28-abf5-40ff-bd42-b3d764e8f7d6	b0071aac-fedc-456c-9000-9cef802e87bc	2025-09-12 23:56:53.054565+03	2025-09-19 23:56:53.054565+03
eda6fb0e-0d31-44e3-9f45-80bb71e455b9	67	53b3b2c1ac71828f4006693329b0b9316dcf6449506cc1fc7a61923338c21b10	t	\N	\N	2025-09-13 00:15:24.984938+03	2025-09-20 00:15:24.984938+03
2b0f7d72-9caa-4194-9c62-4efb9cdfc87c	67	a02c10a5e419f0294bb22dfb011b572f9e96e351d1a1545149245a4db1898626	t	\N	\N	2025-09-13 00:18:42.618977+03	2025-09-20 00:18:42.618977+03
dd55cae4-cfc9-441e-b926-0a25473bca71	67	a1a18e76dd7746d9c025ee4e5477c627288c1fcfa36e7a20b179c023f6a33af3	t	\N	\N	2025-09-13 00:21:59.580655+03	2025-09-20 00:21:59.580655+03
832a99b2-3606-4ded-ad25-91089c1ab5b6	67	3fe66746aaef79a237f3218d2ed80e06b09708f3d875bc3f303a532de2caec9d	t	\N	\N	2025-09-13 00:26:08.129024+03	2025-09-20 00:26:08.129024+03
20979dc5-6122-464f-ad8f-b41510fc6240	67	b54fc5ca3c0be79182f43cb13341d474a6d2bd0f4e97103c935b52fb8ffb630e	t	\N	\N	2025-09-13 00:27:23.393175+03	2025-09-20 00:27:23.393175+03
73f2f775-3af9-497f-8694-8119790fe8ab	67	d59c029b54f5a7daa1da18d8bedb4f26d09b8e7c7e35ff183171e23f1d517367	t	578244e4-4be0-47dd-9dca-ae60fad6cf42	0fae82ee-8abd-4764-b479-b4f4dca32523	2025-09-14 00:57:37.022865+03	2025-09-21 00:57:37.022865+03
9eced2f5-f0bc-44a2-94be-e82138506bb6	67	8d24d2b83fff9aba3431df01c6e1d6650fea85c4c40c57afeb83692e01d611b0	t	\N	24c06570-52ce-4281-a0ea-623c6b51f337	2025-09-13 00:29:01.784939+03	2025-09-20 00:29:01.784939+03
7c165dd5-da6a-48ef-afa8-5b79e3b91fbd	67	f89e943f85615e9f1514099c4d56716283278f7b1045c479f816284e452e3d8e	t	\N	\N	2025-09-13 23:49:42.574932+03	2025-09-20 23:49:42.574932+03
10d12b64-eaba-4b12-8ebb-3fe1ea86fd7c	67	0b77a23d193e05c9039afe238fa3ac8d7d1987709d94f34bc00362ab5dbe15ec	t	\N	\N	2025-09-13 23:52:18.869703+03	2025-09-20 23:52:18.869703+03
5c3947ce-16e5-4757-933b-fdd5f86a3d95	67	784d63626bece8fb80a7ea1dbf553dd6c5f8624d04665936f051144063902dd4	t	8a80918d-1bc4-40ae-b04f-bbc07dc5c8ef	92b659fc-fdfc-4913-a7e0-41b293dadfba	2025-09-15 20:04:58.089727+03	2025-09-22 20:04:58.089727+03
24c06570-52ce-4281-a0ea-623c6b51f337	67	db05ae1716a87d1e4be1331ab0570eb1e17d331da945dd29c976dba495a7d425	t	9eced2f5-f0bc-44a2-94be-e82138506bb6	44c5fa08-5085-4d9b-b306-cc33667fec4a	2025-09-13 01:06:29.655982+03	2025-09-20 01:06:29.655982+03
98c8df23-7b4c-4e7b-a826-c2d9e3193d37	67	7e117afd9556c267c63e156ebb77aec36414902f57b40b7d75f0fd1f79803e65	t	\N	\N	2025-09-14 00:16:47.646038+03	2025-09-21 00:16:47.646038+03
e2bfaa33-ff26-41c3-9b3a-a20d9477bbba	67	a83da7e722461b82843f4f2999b13758dc96798be37984c108c56768514c4a67	t	\N	\N	2025-09-14 00:18:35.35852+03	2025-09-21 00:18:35.35852+03
9f38eaf7-96a2-450b-9904-d3797d0e96a0	67	5ee31a62c1269a2f44651dcda51bffc2114fefe9a0eee6f2411ec32d57166bb6	t	\N	\N	2025-09-14 00:29:52.021075+03	2025-09-21 00:29:52.021075+03
12a9cc98-d127-4b3f-abc7-3f4600e5f24e	67	6a9a2193e6994c434918871aa631d735c5339818f0bf0b74cd6d98638a1556c2	t	\N	\N	2025-09-14 00:32:18.497701+03	2025-09-21 00:32:18.497701+03
0f0af557-2b97-4135-a79e-f0bfbaa3dcff	67	944bc138890dccf95cb665c5da15df47da1f900a6ad9ca93d3b410dbdd7259ab	t	\N	\N	2025-09-14 00:36:15.400678+03	2025-09-21 00:36:15.400678+03
e569b818-c4b0-49ab-a3ef-4ae28eb4ab5e	67	a6b0beec03204b7de0b9c00eed550b6475aebe5d8ec86e5cbe91ce62fd30ddb3	t	\N	\N	2025-09-14 00:43:31.620284+03	2025-09-21 00:43:31.620284+03
a46c0101-8170-4680-8155-593d3c574dfc	67	fea60f307b14f7b25dd58b3711d05609402d9be5c27647e545114dafb7150e1f	t	\N	\N	2025-09-14 00:52:27.136253+03	2025-09-21 00:52:27.136253+03
1b3fe254-e4fe-40d0-aa0e-c476db3e173e	67	537e49634eca135568590b3ebd845ab69723d9f744c737bc8ac35a9c6ef0115f	t	\N	ee3e9f02-44a4-4339-b5bd-608178134d7c	2025-09-14 00:55:09.6958+03	2025-09-21 00:55:09.6958+03
0fae82ee-8abd-4764-b479-b4f4dca32523	67	793ff6a7fa5060ac05f82ec1c8dff14db838eeb3419534cea8bb0827dc2740ab	t	73f2f775-3af9-497f-8694-8119790fe8ab	0d11f074-9506-42e8-92ec-aaaba0140179	2025-09-14 00:57:52.028922+03	2025-09-21 00:57:52.028922+03
ee3e9f02-44a4-4339-b5bd-608178134d7c	67	14369d425a0967563fdea620746007ce5ada60d5b28b45cd2f7d5860a9cabb81	t	1b3fe254-e4fe-40d0-aa0e-c476db3e173e	eabb444c-f88b-46a0-8a66-64ba43c4116d	2025-09-14 00:55:52.378597+03	2025-09-21 00:55:52.378597+03
eabb444c-f88b-46a0-8a66-64ba43c4116d	67	424dc4b9349e3322ef5f1a6fedd15869bf2fd4176b88baac998047938cec14e1	t	ee3e9f02-44a4-4339-b5bd-608178134d7c	98a0f4b4-911e-4d38-aa61-7a35da23f1e1	2025-09-14 00:56:07.01832+03	2025-09-21 00:56:07.01832+03
98a0f4b4-911e-4d38-aa61-7a35da23f1e1	67	ba3281c99bc9fea1aa8a02c4d45a26640ff22984b76615b67f55cfc576d692e6	t	eabb444c-f88b-46a0-8a66-64ba43c4116d	0a4adcd7-3c63-42fb-a891-996f93ab47bd	2025-09-14 00:56:22.018613+03	2025-09-21 00:56:22.018613+03
0d11f074-9506-42e8-92ec-aaaba0140179	67	0caab47b300501434ed840f2f3e1087ed0cfb0a8622cc37cc6d562da96ff4880	t	0fae82ee-8abd-4764-b479-b4f4dca32523	bd9a48a8-97a0-4c14-98d5-34ffdfdf1ee8	2025-09-14 00:58:07.022231+03	2025-09-21 00:58:07.022231+03
0a4adcd7-3c63-42fb-a891-996f93ab47bd	67	67a2021f721d254a2d7ea604ed14148af3d9467f6e257cc443ba4a2ffe04c996	t	98a0f4b4-911e-4d38-aa61-7a35da23f1e1	d74b2ed6-e1c8-4782-9d51-ab96e6b517cc	2025-09-14 00:56:37.028933+03	2025-09-21 00:56:37.028933+03
d74b2ed6-e1c8-4782-9d51-ab96e6b517cc	67	dfb742ba2f0b09876f82e61d5565a5dd45c93f465b6b0e2b25085c3279f645a7	t	0a4adcd7-3c63-42fb-a891-996f93ab47bd	a46aae6e-ed8e-4bb8-9080-1f7b1a6a9c8c	2025-09-14 00:56:52.028541+03	2025-09-21 00:56:52.028541+03
135cf1c0-4cc0-48ed-93f1-7acdd4e0ce6d	67	183351278328aa6aa048df7aef0fb493292da4438998bf51d1ea9b1caa245ed2	f	bd9a48a8-97a0-4c14-98d5-34ffdfdf1ee8	\N	2025-09-14 00:58:37.027654+03	2025-09-21 00:58:37.027654+03
a46aae6e-ed8e-4bb8-9080-1f7b1a6a9c8c	67	5b691fef00aae82857450eac662c65e012143e1b88993467d0d93563a3119ed0	t	d74b2ed6-e1c8-4782-9d51-ab96e6b517cc	578244e4-4be0-47dd-9dca-ae60fad6cf42	2025-09-14 00:57:07.025676+03	2025-09-21 00:57:07.025676+03
bd9a48a8-97a0-4c14-98d5-34ffdfdf1ee8	67	71b6649e171e4d3fe0da7c637e86e84c29b7676073054c64db15737175a3987a	t	0d11f074-9506-42e8-92ec-aaaba0140179	135cf1c0-4cc0-48ed-93f1-7acdd4e0ce6d	2025-09-14 00:58:22.03229+03	2025-09-21 00:58:22.03229+03
578244e4-4be0-47dd-9dca-ae60fad6cf42	67	2917999db687b178ad9feeede09bc641cfca0095f39dce40894714d93076b1cc	t	a46aae6e-ed8e-4bb8-9080-1f7b1a6a9c8c	73f2f775-3af9-497f-8694-8119790fe8ab	2025-09-14 00:57:22.036116+03	2025-09-21 00:57:22.036116+03
92b659fc-fdfc-4913-a7e0-41b293dadfba	67	b394a333f5371849b1f759920d73bfb0658173a4ed2c351a3d595b5520556f3a	t	5c3947ce-16e5-4757-933b-fdd5f86a3d95	aa4aef7c-316f-4169-8d58-e81437832856	2025-09-15 20:05:13.19624+03	2025-09-22 20:05:13.19624+03
5ab27255-3d67-4c7f-ae67-6b9fee02b116	67	9c8482fe6bea90aa371547dfd73338611b31b83c221078a768fa2939f6deb9e1	t	fdae3a33-a3f9-424e-b429-5a72230fe5ae	171e4163-250f-4954-9283-cd17b667d888	2025-09-15 20:07:31.07077+03	2025-09-22 20:07:31.07077+03
44c5fa08-5085-4d9b-b306-cc33667fec4a	67	6629816e5bfd3967b81ffe810557984366af020ef2407fc53415a36099753274	t	24c06570-52ce-4281-a0ea-623c6b51f337	143d510b-ea89-4fc0-b9f1-7f3dc15fe782	2025-09-13 23:58:03.679193+03	2025-09-20 23:58:03.679193+03
143d510b-ea89-4fc0-b9f1-7f3dc15fe782	67	c459768ba4303ed1207d9e0eeba243949f11ec3c1a759d05c81c66a39486474f	t	44c5fa08-5085-4d9b-b306-cc33667fec4a	\N	2025-09-15 16:30:25.268239+03	2025-09-22 16:30:25.268239+03
79fd7e41-ac63-442e-afc3-d64e54e7d316	67	70efe5e75cf401667684981fea42eea31af0021c6709e1b380245cadcb098c6c	t	\N	0157ccb7-d359-4402-b4ce-af3b2f52f217	2025-09-15 20:04:13.976113+03	2025-09-22 20:04:13.976113+03
aa4aef7c-316f-4169-8d58-e81437832856	67	fb1e978cd5169bedb05590159b9acb99a0f7a4a37a6b68e81f4d4116e50245d3	t	92b659fc-fdfc-4913-a7e0-41b293dadfba	e0e87783-6e58-435c-b8a8-e48550b6e2c4	2025-09-15 20:05:28.148551+03	2025-09-22 20:05:28.148551+03
0157ccb7-d359-4402-b4ce-af3b2f52f217	67	36c06d44058e719532f8c87c106b6e9474d514943d29692fd669b0bb4c17499b	t	79fd7e41-ac63-442e-afc3-d64e54e7d316	8a80918d-1bc4-40ae-b04f-bbc07dc5c8ef	2025-09-15 20:04:28.181736+03	2025-09-22 20:04:28.181736+03
8a80918d-1bc4-40ae-b04f-bbc07dc5c8ef	67	d9d0f39ce36a02369b419acaab8c6ad25179843d2009ae2b12d23d7aa5d371e3	t	0157ccb7-d359-4402-b4ce-af3b2f52f217	5c3947ce-16e5-4757-933b-fdd5f86a3d95	2025-09-15 20:04:43.078423+03	2025-09-22 20:04:43.078423+03
522ad422-4612-400b-90f3-c4fa823c3ce7	67	133cacd3c7e5494f37f00580c2ddb7e6b9b48cd68b22a3d5f9b21dd9bb9680ff	t	\N	fc87dabb-1338-4b60-8ef0-1200372eceab	2025-09-15 20:06:46.482469+03	2025-09-22 20:06:46.482469+03
e0e87783-6e58-435c-b8a8-e48550b6e2c4	67	ebbc522aa3c15af442cfc875eca768205303ed3b6f6038d5ce85bc879ae332a0	t	aa4aef7c-316f-4169-8d58-e81437832856	b8cbd71b-1e0d-480c-b132-19a9d8a456d2	2025-09-15 20:05:43.240867+03	2025-09-22 20:05:43.240867+03
6e8c8440-2cd6-49f7-b243-fe06c7de77d0	67	4ff00cda95fa94730ece480a5fa8054b14dde7f114b591f0b1fe97cd5f22664f	f	fdae3a33-a3f9-424e-b429-5a72230fe5ae	\N	2025-09-15 20:07:31.068186+03	2025-09-22 20:07:31.068186+03
b8cbd71b-1e0d-480c-b132-19a9d8a456d2	67	3fde580f4f07c7b45787be1153d85ac83dc09cadbf67b5529d4ebc7f4d7faee9	t	e0e87783-6e58-435c-b8a8-e48550b6e2c4	822e30a9-29cb-4a6a-a202-6a098921e0f6	2025-09-15 20:05:58.042692+03	2025-09-22 20:05:58.042692+03
e231990b-a1ba-4f3c-a622-bb6f59815179	67	f2bb85d6890ebcd4fd9f2bc356120691430ed5717e6dc1a4bd35509450da2e58	f	822e30a9-29cb-4a6a-a202-6a098921e0f6	\N	2025-09-15 20:06:28.088677+03	2025-09-22 20:06:28.088677+03
822e30a9-29cb-4a6a-a202-6a098921e0f6	67	aae9a795c1a8c2e188cb7423ca2e8203c0ff2c3082749e60054eea18e7086f4e	t	b8cbd71b-1e0d-480c-b132-19a9d8a456d2	e231990b-a1ba-4f3c-a622-bb6f59815179	2025-09-15 20:06:13.210768+03	2025-09-22 20:06:13.210768+03
acdf5edd-74df-491b-8ce4-d9f25f11ac88	67	094b848eb76b8c682903269fc3d1b04dd390e1cdc2bfe3830e9395483b1d0c3f	f	fc87dabb-1338-4b60-8ef0-1200372eceab	\N	2025-09-15 20:07:16.15348+03	2025-09-22 20:07:16.15348+03
fc87dabb-1338-4b60-8ef0-1200372eceab	67	e477d673c3126eb51a03962e33561e3a4e6c46b980c5c29499f2801a0d09ced9	t	522ad422-4612-400b-90f3-c4fa823c3ce7	fdae3a33-a3f9-424e-b429-5a72230fe5ae	2025-09-15 20:07:01.053376+03	2025-09-22 20:07:01.053376+03
fdae3a33-a3f9-424e-b429-5a72230fe5ae	67	0a329ab1d38d3ceb7bb96fc955849767b11a48670b92e08b1d6cf36727cc6bd7	t	fc87dabb-1338-4b60-8ef0-1200372eceab	5ab27255-3d67-4c7f-ae67-6b9fee02b116	2025-09-15 20:07:16.157249+03	2025-09-22 20:07:16.157249+03
171e4163-250f-4954-9283-cd17b667d888	67	412be529b1e57c186a504089b8ee5c3fea119db623d446538c8d5900ec5484e2	t	5ab27255-3d67-4c7f-ae67-6b9fee02b116	7c924912-af28-4dfc-ae5c-bcb7367abf29	2025-09-15 20:07:46.073627+03	2025-09-22 20:07:46.073627+03
7c924912-af28-4dfc-ae5c-bcb7367abf29	67	50097e22f0a4f2575e36a73a1369d0b9e4b1fb3b6aa1d75ade8e5c72e39cc660	t	171e4163-250f-4954-9283-cd17b667d888	2e36d1bf-a6ba-4450-a1d2-bac7c77652cd	2025-09-15 20:08:01.121857+03	2025-09-22 20:08:01.121857+03
2e36d1bf-a6ba-4450-a1d2-bac7c77652cd	67	c0611226f07caaff6f520e76b57481592272c4527bea2af601970743383be464	t	7c924912-af28-4dfc-ae5c-bcb7367abf29	942d38d5-1255-4fa3-b76a-edd441405c8a	2025-09-15 20:08:16.051317+03	2025-09-22 20:08:16.051317+03
942d38d5-1255-4fa3-b76a-edd441405c8a	67	e653b2f5858fabaa9d1cb5826d0326255070c6cb701fff9492cb69162b6fe747	t	2e36d1bf-a6ba-4450-a1d2-bac7c77652cd	a40365df-3fc9-43e5-bec9-0f9463ff0362	2025-09-15 20:08:31.052985+03	2025-09-22 20:08:31.052985+03
a40365df-3fc9-43e5-bec9-0f9463ff0362	67	9cc27f0fc859824f41e4ee3146ff45dbc8c9903153cc8d8f5c2c76f67ad4c118	t	942d38d5-1255-4fa3-b76a-edd441405c8a	3ea6e235-ea29-413b-b182-ea41ffd8b6a8	2025-09-15 20:08:46.045036+03	2025-09-22 20:08:46.045036+03
3ea6e235-ea29-413b-b182-ea41ffd8b6a8	67	aef84ae1f3f41f7ceae22da6c57e0b58b4025ee0515160f1362c3b4d552fb0e1	t	a40365df-3fc9-43e5-bec9-0f9463ff0362	5eedcad3-c5cb-42bf-8079-d84a34cf7481	2025-09-15 20:09:01.029406+03	2025-09-22 20:09:01.029406+03
5eedcad3-c5cb-42bf-8079-d84a34cf7481	67	79158ae1e3f148c254c28b2911c39b542eae7a0f46cbf9ea737e5c60ca39e622	t	3ea6e235-ea29-413b-b182-ea41ffd8b6a8	f94e2891-8847-4b49-942d-b79dd1476520	2025-09-15 20:09:16.043967+03	2025-09-22 20:09:16.043967+03
906b70b8-c209-4e52-8230-81ee45d073a7	67	2d1b5e4f83e9cb91e44c5e3d63941cbbb79cb17c3c1f3fea22d9bda705cbacca	t	59cc5529-e13a-4791-94fa-4412b9aaad64	a896690a-2807-486b-9448-435513b38b40	2025-09-15 20:17:31.019315+03	2025-09-22 20:17:31.019315+03
f94e2891-8847-4b49-942d-b79dd1476520	67	7ac37398625b83f7cb169b5478a7cd08dd0eb63b385222ec347f92a60292a2a9	t	5eedcad3-c5cb-42bf-8079-d84a34cf7481	37a75ce3-1d1b-4f78-b748-9a6f1974aa34	2025-09-15 20:09:31.052847+03	2025-09-22 20:09:31.052847+03
37a75ce3-1d1b-4f78-b748-9a6f1974aa34	67	7a8ebb195dfab789155e16c26ca479b0155263b6b917cc8486b9feef3606052c	t	f94e2891-8847-4b49-942d-b79dd1476520	03074316-7995-468c-9a3f-6e4cbfe21f4f	2025-09-15 20:09:46.018271+03	2025-09-22 20:09:46.018271+03
068f1b1c-a861-453f-87b0-55f49841815c	67	1fcc8dbfcb0b76b98fad28e0f0be841eed595614156752142d34cd4f286fa629	t	a7a444d5-6a70-4933-bee2-38d54ad97eb0	dcf5ccdd-4b51-4ee2-8821-c2d1f2faa0db	2025-09-15 20:13:31.042488+03	2025-09-22 20:13:31.042488+03
03074316-7995-468c-9a3f-6e4cbfe21f4f	67	81964d1133813c52d802b28cdb9f0ff3bb2683e9407e9f97bca9e00bf131ea78	t	37a75ce3-1d1b-4f78-b748-9a6f1974aa34	2a2b73d1-6832-4bc5-bdf2-de11aab92611	2025-09-15 20:10:01.022297+03	2025-09-22 20:10:01.022297+03
2a2b73d1-6832-4bc5-bdf2-de11aab92611	67	56913e194931d6f71612feec90d4d61746eccea89e6b567821f5b86c44efdb96	t	03074316-7995-468c-9a3f-6e4cbfe21f4f	e6a073d4-b9a0-41e6-a201-60450786960f	2025-09-15 20:10:16.023397+03	2025-09-22 20:10:16.023397+03
e6a073d4-b9a0-41e6-a201-60450786960f	67	a33ec64ff9ec54aae8ffecb1b395afff966d6478040f5a03e425f4b94e8b9e93	t	2a2b73d1-6832-4bc5-bdf2-de11aab92611	bb6b739f-f50a-46fa-b5d0-660471c52b40	2025-09-15 20:10:31.043523+03	2025-09-22 20:10:31.043523+03
dcf5ccdd-4b51-4ee2-8821-c2d1f2faa0db	67	0054d0729962b6ae47fd317fe71cc8bf609572d13a71e06821a679417c6a4225	t	068f1b1c-a861-453f-87b0-55f49841815c	063e9e34-9008-452b-9afd-1026dc87ea5e	2025-09-15 20:13:46.018282+03	2025-09-22 20:13:46.018282+03
bb6b739f-f50a-46fa-b5d0-660471c52b40	67	3265ce8c6fb82f4993e2043437821244b7a35257d9eceadd16e0581a0c557faf	t	e6a073d4-b9a0-41e6-a201-60450786960f	5b23e930-7858-4ec3-8e36-a5ceaff38840	2025-09-15 20:10:46.022353+03	2025-09-22 20:10:46.022353+03
797b78b6-0cef-4e13-a5a9-228cb21497bb	67	c71222e9c04af8a92f03bcb327ec93a2c3eb4a4c73e38b51491210e8e148f0a6	t	6d26b98f-9437-4032-bef5-2ab66bc94059	d6a7fa47-c8ed-4ecd-9185-64250e64856a	2025-09-15 20:16:01.04509+03	2025-09-22 20:16:01.04509+03
5b23e930-7858-4ec3-8e36-a5ceaff38840	67	8860eed2f39323bc1f5059c36e25af02ee394f347da960f2b97685f6a833851e	t	bb6b739f-f50a-46fa-b5d0-660471c52b40	1b51b618-28dd-4104-aa05-85358106ca92	2025-09-15 20:11:01.054128+03	2025-09-22 20:11:01.054128+03
1b51b618-28dd-4104-aa05-85358106ca92	67	929a6a18e5783cfcdeb2bbba0a67a7bd3bbdae61eb60f8f47c503e592937025a	t	5b23e930-7858-4ec3-8e36-a5ceaff38840	6497b81d-a2a7-4508-bf69-e4fed29a9d80	2025-09-15 20:11:16.032548+03	2025-09-22 20:11:16.032548+03
063e9e34-9008-452b-9afd-1026dc87ea5e	67	c5848f091be8b6d9361b49c2e6e01afa3d3b57ed463b8326f4fd21b9077c21f9	t	dcf5ccdd-4b51-4ee2-8821-c2d1f2faa0db	8eb1a528-5b15-4b9f-b4c4-fa4d4fd50a03	2025-09-15 20:14:01.053749+03	2025-09-22 20:14:01.053749+03
6497b81d-a2a7-4508-bf69-e4fed29a9d80	67	1f5773679f0002eb5b86adb654704eecfe83766bcd081833d93eb7e4b94f14df	t	1b51b618-28dd-4104-aa05-85358106ca92	ff75baa2-3991-4b5d-bd5c-bbf99f9114c2	2025-09-15 20:11:31.043695+03	2025-09-22 20:11:31.043695+03
d3b35c7f-aec7-402a-bb70-b4c92e584093	67	b95d83e42367309d739413578b98b8ca44605d4300ff0e5db0fab0148c23ce68	t	d5b12f70-30de-4aa8-8249-47e5bd189810	a634aa9f-a240-4379-99c0-3ce28c272f36	2025-09-15 20:18:31.027208+03	2025-09-22 20:18:31.027208+03
ff75baa2-3991-4b5d-bd5c-bbf99f9114c2	67	b9300569f04ff02afa0d46805d00f9cedccbc7ddacb650a3248700dd7d90a2c4	t	6497b81d-a2a7-4508-bf69-e4fed29a9d80	9a367354-695e-4e7c-a69a-2abe02fa8792	2025-09-15 20:11:46.042339+03	2025-09-22 20:11:46.042339+03
9a367354-695e-4e7c-a69a-2abe02fa8792	67	606b43c055105a69e529acd5fdde3a0ddf74897432e135f5573da772738c7db2	t	ff75baa2-3991-4b5d-bd5c-bbf99f9114c2	4d601ac1-ad3d-4079-8027-2b97521cbcea	2025-09-15 20:12:01.038817+03	2025-09-22 20:12:01.038817+03
8eb1a528-5b15-4b9f-b4c4-fa4d4fd50a03	67	8d9ad8cdb48552c328a79c526e8bb5ca0fb72b3c9d391d753693a18d7593c8ab	t	063e9e34-9008-452b-9afd-1026dc87ea5e	6f85f9c1-d6b3-4b07-b98c-71e9aaa0a058	2025-09-15 20:14:16.039101+03	2025-09-22 20:14:16.039101+03
4d601ac1-ad3d-4079-8027-2b97521cbcea	67	37546b90ae58c61cfe435326d5abffed261039f4514cbeb6723e1bb168663528	t	9a367354-695e-4e7c-a69a-2abe02fa8792	70aaaa3b-7828-445e-a543-ccbced27c517	2025-09-15 20:12:16.038162+03	2025-09-22 20:12:16.038162+03
70aaaa3b-7828-445e-a543-ccbced27c517	67	31edac53616710928a3e7a624f88d3ce7dbdb3c03fc62c4a0a3841765b5a0705	t	4d601ac1-ad3d-4079-8027-2b97521cbcea	6131dbae-9872-421c-8572-f3a6c5803f1f	2025-09-15 20:12:31.033448+03	2025-09-22 20:12:31.033448+03
6131dbae-9872-421c-8572-f3a6c5803f1f	67	1a02bddad6d30738f0408b724873a42a262d340f1879510bfa3afa168f6ebc1d	t	70aaaa3b-7828-445e-a543-ccbced27c517	dbeaeec3-b8de-4eed-b871-fdaaf40a9357	2025-09-15 20:12:46.044262+03	2025-09-22 20:12:46.044262+03
6f85f9c1-d6b3-4b07-b98c-71e9aaa0a058	67	fee0f44b57bc5de5d0fd53134d9b57e405ca3772f7bf56271f0cd593c0db9933	t	8eb1a528-5b15-4b9f-b4c4-fa4d4fd50a03	a6c980e3-8ae2-4e70-8c61-e4423e34e782	2025-09-15 20:14:31.019347+03	2025-09-22 20:14:31.019347+03
dbeaeec3-b8de-4eed-b871-fdaaf40a9357	67	26b08af55dab39365334d5f0a89c3b79ed1912494d422a0eea38cb8d6fe52260	t	6131dbae-9872-421c-8572-f3a6c5803f1f	a7a444d5-6a70-4933-bee2-38d54ad97eb0	2025-09-15 20:13:01.065096+03	2025-09-22 20:13:01.065096+03
d6a7fa47-c8ed-4ecd-9185-64250e64856a	67	aaef263f0092f477c80421c1d2be8117288eef3f2b8ddd425b1e6ee6098bc58e	t	797b78b6-0cef-4e13-a5a9-228cb21497bb	27bb5a3e-9de9-4a93-a3e6-64937dae2541	2025-09-15 20:16:16.039617+03	2025-09-22 20:16:16.039617+03
a7a444d5-6a70-4933-bee2-38d54ad97eb0	67	4e8862ee3fa7a1103c7c38e5bd26f1afa1aa61d22fd5138bc4e93baa3f601ee3	t	dbeaeec3-b8de-4eed-b871-fdaaf40a9357	068f1b1c-a861-453f-87b0-55f49841815c	2025-09-15 20:13:16.029399+03	2025-09-22 20:13:16.029399+03
a6c980e3-8ae2-4e70-8c61-e4423e34e782	67	a4db9f14e52ff92e33da1fba75d8cd3d3617a9212ccc21fec420688ab0d688e1	t	6f85f9c1-d6b3-4b07-b98c-71e9aaa0a058	558d2a45-8624-4cd5-a090-475c4d3c6b9e	2025-09-15 20:14:46.044346+03	2025-09-22 20:14:46.044346+03
558d2a45-8624-4cd5-a090-475c4d3c6b9e	67	32b7d2cb8e7281664a5f4cd801c8a0f090605c6ff0d3a13e661e2a390bbdb76b	t	a6c980e3-8ae2-4e70-8c61-e4423e34e782	dd2b35b1-7388-4367-a390-0dd916756865	2025-09-15 20:15:01.0937+03	2025-09-22 20:15:01.0937+03
dd2b35b1-7388-4367-a390-0dd916756865	67	3f77d66a715207086c62ad136808d54ea9000fa44d54e3526a09ff50c2046463	t	558d2a45-8624-4cd5-a090-475c4d3c6b9e	58050466-ffcd-4530-9394-06b100475eb5	2025-09-15 20:15:16.052753+03	2025-09-22 20:15:16.052753+03
27bb5a3e-9de9-4a93-a3e6-64937dae2541	67	75d249f78913bdd583a3206ad222a6e296c42cd807c9ef550072e4a9d7d12a02	t	d6a7fa47-c8ed-4ecd-9185-64250e64856a	c8daa383-9564-42bc-a5d7-887a397a620d	2025-09-15 20:16:31.040635+03	2025-09-22 20:16:31.040635+03
58050466-ffcd-4530-9394-06b100475eb5	67	22489897750780503e48038fbf88640db74d739050ab40970452d9077bf716f8	t	dd2b35b1-7388-4367-a390-0dd916756865	6d26b98f-9437-4032-bef5-2ab66bc94059	2025-09-15 20:15:31.052318+03	2025-09-22 20:15:31.052318+03
a896690a-2807-486b-9448-435513b38b40	67	ba40b144d1afc528e32466f0578824e724ce4b63b1a1415997702345d40c8f48	t	906b70b8-c209-4e52-8230-81ee45d073a7	f5db37e8-ca98-4df0-aa8d-b7c9c537ec3d	2025-09-15 20:17:46.020574+03	2025-09-22 20:17:46.020574+03
6d26b98f-9437-4032-bef5-2ab66bc94059	67	85bac214401eca6269c67ab1afd2c870f3521934ae234dad4d338b8d6c706359	t	58050466-ffcd-4530-9394-06b100475eb5	797b78b6-0cef-4e13-a5a9-228cb21497bb	2025-09-15 20:15:46.017234+03	2025-09-22 20:15:46.017234+03
c8daa383-9564-42bc-a5d7-887a397a620d	67	234c8d85e804464c03df713073f4df2924dbe197939d3695fd07e0fcec24b27d	t	27bb5a3e-9de9-4a93-a3e6-64937dae2541	47b629b6-b6f5-4627-8e85-fc46409d612b	2025-09-15 20:16:46.062503+03	2025-09-22 20:16:46.062503+03
0debfe83-392c-4c1b-a527-806baf0475ab	67	0053be334c27c4779945a3ee413b64baf2ef2c127aaaddbaba65d84a0937ef85	t	0010ae59-61e6-47c5-8380-16eef007f857	3441d6a9-e4c3-491b-91d3-a2a5202ebdc3	2025-09-15 20:19:31.032455+03	2025-09-22 20:19:31.032455+03
47b629b6-b6f5-4627-8e85-fc46409d612b	67	4f2dfa9c4fd04530ea4c8da6a3158cde1f117c795e7f466c0e6ac9c6c043c85b	t	c8daa383-9564-42bc-a5d7-887a397a620d	59cc5529-e13a-4791-94fa-4412b9aaad64	2025-09-15 20:17:01.026385+03	2025-09-22 20:17:01.026385+03
59cc5529-e13a-4791-94fa-4412b9aaad64	67	a8794a0de8c1d393f0e42443a3655c81ee75022296f1394ac05f9e6f9624ff72	t	47b629b6-b6f5-4627-8e85-fc46409d612b	906b70b8-c209-4e52-8230-81ee45d073a7	2025-09-15 20:17:16.026557+03	2025-09-22 20:17:16.026557+03
f5db37e8-ca98-4df0-aa8d-b7c9c537ec3d	67	e69eeb0d25df24790a5c17d8c31c7185f339e476b9d9b44b0df9fb078aa53e79	t	a896690a-2807-486b-9448-435513b38b40	d5b12f70-30de-4aa8-8249-47e5bd189810	2025-09-15 20:18:01.049899+03	2025-09-22 20:18:01.049899+03
a634aa9f-a240-4379-99c0-3ce28c272f36	67	6183cc23167c463495f928939b914e8e2dc304b5fab880b797f2bb253acac99f	t	d3b35c7f-aec7-402a-bb70-b4c92e584093	14af9512-a7cf-4482-8bb3-8ce22451b2ba	2025-09-15 20:18:46.047912+03	2025-09-22 20:18:46.047912+03
d5b12f70-30de-4aa8-8249-47e5bd189810	67	5e9724954b88affce1546957d4ba6f3b28208964634e865738d4b8d8f1e351b3	t	f5db37e8-ca98-4df0-aa8d-b7c9c537ec3d	d3b35c7f-aec7-402a-bb70-b4c92e584093	2025-09-15 20:18:16.024135+03	2025-09-22 20:18:16.024135+03
0010ae59-61e6-47c5-8380-16eef007f857	67	ab51bb81e638475c5bfb02f86916785dbd8896bf0bbe9e5a21ab157c8ec3fb24	t	14af9512-a7cf-4482-8bb3-8ce22451b2ba	0debfe83-392c-4c1b-a527-806baf0475ab	2025-09-15 20:19:16.052364+03	2025-09-22 20:19:16.052364+03
14af9512-a7cf-4482-8bb3-8ce22451b2ba	67	91d7182d5af1a31d4728029eaae9f54cd4b5bf5fbabc4a2bda4b2b1ed487043d	t	a634aa9f-a240-4379-99c0-3ce28c272f36	0010ae59-61e6-47c5-8380-16eef007f857	2025-09-15 20:19:01.029217+03	2025-09-22 20:19:01.029217+03
3441d6a9-e4c3-491b-91d3-a2a5202ebdc3	67	77c356893aa9da4055088a8c2b2c0ba777c71a4c3c390a8896edf396ac38cd97	t	0debfe83-392c-4c1b-a527-806baf0475ab	7f823c84-e47a-4013-9efe-a01677a22381	2025-09-15 20:19:46.043623+03	2025-09-22 20:19:46.043623+03
7f823c84-e47a-4013-9efe-a01677a22381	67	84233e5b81907510371f29df41b162c40c2fe432c53e53d0b070c74770c4833f	t	3441d6a9-e4c3-491b-91d3-a2a5202ebdc3	ce97c1d7-c692-4ad3-9b1d-db116abad98e	2025-09-15 20:20:01.065018+03	2025-09-22 20:20:01.065018+03
ce97c1d7-c692-4ad3-9b1d-db116abad98e	67	f39c67647c810b234f000bbe2ec9eb417933918d9f2d1d4517878481effa6619	t	7f823c84-e47a-4013-9efe-a01677a22381	49b5efd3-0b92-45c0-98b1-67bcf3eff453	2025-09-15 20:20:16.015853+03	2025-09-22 20:20:16.015853+03
49b5efd3-0b92-45c0-98b1-67bcf3eff453	67	ff18d7032fec98d80d7df13952af21534607241ac5f994db55f71cbcf7c80891	t	ce97c1d7-c692-4ad3-9b1d-db116abad98e	783eae11-14ff-476a-879e-a0530b7b4ce0	2025-09-15 20:20:31.087242+03	2025-09-22 20:20:31.087242+03
783eae11-14ff-476a-879e-a0530b7b4ce0	67	de27fee39f15a1a54d4de7abd380c31297f005b7f309d61810d9a29f5bfb13a0	t	49b5efd3-0b92-45c0-98b1-67bcf3eff453	f0a2b191-0191-4945-9dd8-1cfd95ba10bb	2025-09-15 20:20:46.019277+03	2025-09-22 20:20:46.019277+03
f0a2b191-0191-4945-9dd8-1cfd95ba10bb	67	ccde504dec7e5b217bc6f06f5e0074bc200a1447ca13925952e7020f7e4f1404	t	783eae11-14ff-476a-879e-a0530b7b4ce0	ef44294b-9817-430f-8279-289a9c1e28b3	2025-09-15 20:21:01.043806+03	2025-09-22 20:21:01.043806+03
ef44294b-9817-430f-8279-289a9c1e28b3	67	adcaad53db6c87036edae662d96b416f14951fd55373ab8c4787d7d2182fa57c	t	f0a2b191-0191-4945-9dd8-1cfd95ba10bb	07d9c593-c758-4999-aa04-cb29753b4138	2025-09-15 20:21:16.032071+03	2025-09-22 20:21:16.032071+03
07d9c593-c758-4999-aa04-cb29753b4138	67	9635ac31001cf7b3bab327a03ecb86d19076ad53be892a308ace49bb3b146a0b	t	ef44294b-9817-430f-8279-289a9c1e28b3	cae72864-5e9c-424b-ae32-d2e08c0db124	2025-09-15 20:21:31.057509+03	2025-09-22 20:21:31.057509+03
cae72864-5e9c-424b-ae32-d2e08c0db124	67	9bc71fee6428ca2b495e81f77d5e23f6d4a2a27806311a3d7324bcbc0da67fa3	t	07d9c593-c758-4999-aa04-cb29753b4138	919d8768-e5ee-439c-bae0-8aba82617702	2025-09-15 20:21:46.02974+03	2025-09-22 20:21:46.02974+03
919d8768-e5ee-439c-bae0-8aba82617702	67	b6a6ea7a1eff6ef316b8c4ff970197160cd4eeef92a9180ff85c35d35c54583c	t	cae72864-5e9c-424b-ae32-d2e08c0db124	1c4a8b8b-bc1a-43d8-a145-33a2944f2018	2025-09-15 20:22:01.0662+03	2025-09-22 20:22:01.0662+03
1c4a8b8b-bc1a-43d8-a145-33a2944f2018	67	8b113117ebaea84b94faa6e6a73c4479ac87d72956af27ef45e39f6bd381d4da	t	919d8768-e5ee-439c-bae0-8aba82617702	4650689a-0bb3-417b-9638-023dfeca154b	2025-09-15 20:22:16.011836+03	2025-09-22 20:22:16.011836+03
4650689a-0bb3-417b-9638-023dfeca154b	67	a0bca6ab74dfa74d6dc441036432b868f3d4b8855219ed31e7ef39fb891211de	t	1c4a8b8b-bc1a-43d8-a145-33a2944f2018	f5e9af03-9d02-4f34-85c7-5ec1ef98b0c2	2025-09-15 20:22:31.02458+03	2025-09-22 20:22:31.02458+03
f5e9af03-9d02-4f34-85c7-5ec1ef98b0c2	67	30d3295217af15f3803af2f928087d827aab771ca707be34a56c26cd6737923b	t	4650689a-0bb3-417b-9638-023dfeca154b	6a77cba4-ca02-48c6-a35b-fedeef1574cd	2025-09-15 20:22:46.027316+03	2025-09-22 20:22:46.027316+03
6a77cba4-ca02-48c6-a35b-fedeef1574cd	67	0e0e8440e6cb5c9076a935ca7d45e62a4f12de74655919bac2343f8ec3de91b7	t	f5e9af03-9d02-4f34-85c7-5ec1ef98b0c2	de8507fb-ac43-46c1-86ef-1507329bbb53	2025-09-15 20:23:27.032824+03	2025-09-22 20:23:27.032824+03
de8507fb-ac43-46c1-86ef-1507329bbb53	67	d9c2191b7f3dc453f5db76d3a42f825367ead436a531e567e507b409ab2a2d3d	t	6a77cba4-ca02-48c6-a35b-fedeef1574cd	7835829b-db59-4fd9-8be3-024a349697cd	2025-09-15 20:41:55.526979+03	2025-09-22 20:41:55.526979+03
7835829b-db59-4fd9-8be3-024a349697cd	67	59498f991ba107eb73457f2465976327a2511d90ff912a1da8b96eefc3b20126	t	de8507fb-ac43-46c1-86ef-1507329bbb53	\N	2025-09-15 20:42:17.910314+03	2025-09-22 20:42:17.910314+03
\.


--
-- Data for Name: request_dates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_dates (id, request_id, date) FROM stdin;
65	29	2025-09-11
247	133	2025-09-26
68	30	2025-10-25
70	32	2025-09-12
202	93	2025-09-15
206	97	2025-09-27
207	98	2025-10-27
208	98	2025-10-29
211	100	2025-11-01
212	101	2025-11-08
213	102	2025-11-21
214	103	2025-10-23
215	104	2025-09-26
35	10	2025-09-10
36	10	2025-09-25
42	10	2025-09-27
44	15	2025-09-23
107	49	2025-09-23
47	17	2025-09-06
48	17	2025-09-28
108	49	2025-09-15
51	12	2025-09-06
52	15	2025-09-06
53	18	2025-09-06
\.


--
-- Data for Name: request_timeslot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_timeslot (id, request_date_id, start_time, end_time) FROM stdin;
110	70	00:00:00	01:00:00
65	52	05:00:00	05:30:00
64	44	03:00:00	04:00:00
196	206	00:00:00	02:00:00
197	208	04:30:00	06:30:00
43	35	21:00:00	22:30:00
48	42	21:30:00	22:30:00
108	65	00:00:00	02:00:00
69	53	00:00:00	02:00:00
62	51	02:30:00	04:00:00
121	108	00:00:00	01:30:00
120	107	00:00:00	00:30:00
\.


--
-- Data for Name: response_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.response_answers (id, response_id, question_id, answer_text, answer_number, answer_bool, answer_json, skipped, created_at) FROM stdin;
1	1	1	\N	4	\N	\N	f	2025-09-12 17:52:43.0635+03
2	1	2	\N	\N	\N	["battle_diorama"]	f	2025-09-12 17:52:43.0635+03
3	1	3	\N	\N	t	\N	f	2025-09-12 17:52:43.0635+03
4	1	4	More interactive exhibits would be great!	\N	\N	\N	f	2025-09-12 17:52:43.0635+03
5	1	5	\N	\N	\N	["word_of_mouth"]	f	2025-09-12 17:52:43.0635+03
6	2	1	\N	5	\N	\N	f	2025-09-12 17:52:43.0635+03
7	2	2	\N	\N	\N	["multimedia_presentation"]	f	2025-09-12 17:52:43.0635+03
8	2	3	\N	\N	t	\N	f	2025-09-12 17:52:43.0635+03
9	2	4	Excellent museum!	\N	\N	\N	f	2025-09-12 17:52:43.0635+03
10	2	5	\N	\N	\N	["social_media"]	f	2025-09-12 17:52:43.0635+03
11	3	1	\N	3	\N	\N	f	2025-09-12 17:52:43.0635+03
12	3	2	\N	\N	\N	["historical_artifacts"]	f	2025-09-12 17:52:43.0635+03
13	3	3	\N	\N	t	\N	f	2025-09-12 17:52:43.0635+03
14	3	4	Better signage would help navigation	\N	\N	\N	f	2025-09-12 17:52:43.0635+03
15	3	5	\N	\N	\N	["travel_guide"]	f	2025-09-12 17:52:43.0635+03
16	4	6	\N	4	\N	\N	f	2025-09-12 17:52:43.0635+03
17	4	7	\N	\N	\N	["battle_diorama"]	f	2025-09-12 17:52:43.0635+03
18	4	8	\N	\N	t	\N	f	2025-09-12 17:52:43.0635+03
19	4	9	ተጨማሪ በይነመረብ አገልግሎት ያስፈልጋል	\N	\N	\N	f	2025-09-12 17:52:43.0635+03
20	4	10	\N	\N	\N	["word_of_mouth"]	f	2025-09-12 17:52:43.0635+03
21	5	6	\N	5	\N	\N	f	2025-09-12 17:52:43.0635+03
22	5	7	\N	\N	\N	["cultural_exhibit"]	f	2025-09-12 17:52:43.0635+03
23	5	8	\N	\N	t	\N	f	2025-09-12 17:52:43.0635+03
24	5	9	በጣም ጥሩ ነው!	\N	\N	\N	f	2025-09-12 17:52:43.0635+03
25	5	10	\N	\N	\N	["social_media"]	f	2025-09-12 17:52:43.0635+03
26	6	1	\N	5	\N	\N	f	2025-09-12 18:21:53.959406+03
27	6	2	\N	\N	\N	["battle_diorama"]	f	2025-09-12 18:21:53.959406+03
28	6	3	\N	\N	t	\N	f	2025-09-12 18:21:53.959406+03
29	6	4	\N	\N	\N	\N	t	2025-09-12 18:21:53.959406+03
30	6	5	\N	\N	\N	["walk_in"]	f	2025-09-12 18:21:53.959406+03
31	7	6	\N	1	\N	\N	f	2025-09-12 18:24:54.451412+03
32	7	7	\N	\N	\N	["battle_diorama"]	f	2025-09-12 18:24:54.451412+03
33	7	8	\N	\N	t	\N	f	2025-09-12 18:24:54.451412+03
34	7	9	\N	\N	\N	\N	t	2025-09-12 18:24:54.451412+03
35	7	10	\N	\N	\N	["travel_guide"]	f	2025-09-12 18:24:54.451412+03
36	8	1	\N	2	\N	\N	f	2025-09-12 18:27:39.232228+03
37	8	2	\N	\N	\N	["art_gallery"]	f	2025-09-12 18:27:39.232228+03
38	8	3	\N	\N	t	\N	f	2025-09-12 18:27:39.232228+03
39	8	4	\N	\N	\N	\N	t	2025-09-12 18:27:39.232228+03
40	8	5	\N	\N	\N	["walk_in"]	f	2025-09-12 18:27:39.232228+03
41	9	1	\N	4	\N	\N	f	2025-09-12 20:53:41.293699+03
42	9	2	\N	\N	\N	["art_gallery"]	f	2025-09-12 20:53:41.293699+03
43	9	3	\N	\N	t	\N	f	2025-09-12 20:53:41.293699+03
44	9	4	\N	\N	\N	\N	t	2025-09-12 20:53:41.293699+03
45	9	5	\N	\N	\N	["walk_in"]	f	2025-09-12 20:53:41.293699+03
46	10	1	\N	5	\N	\N	f	2025-09-12 20:55:24.576792+03
47	10	2	\N	\N	\N	["art_gallery"]	f	2025-09-12 20:55:24.576792+03
48	10	3	\N	\N	t	\N	f	2025-09-12 20:55:24.576792+03
49	10	4	\N	\N	\N	\N	t	2025-09-12 20:55:24.576792+03
50	10	5	\N	\N	\N	["hotel_recommendation"]	f	2025-09-12 20:55:24.576792+03
51	11	1	\N	4	\N	\N	f	2025-09-12 20:59:20.668563+03
52	11	2	\N	\N	\N	["art_gallery"]	f	2025-09-12 20:59:20.668563+03
53	11	3	\N	\N	t	\N	f	2025-09-12 20:59:20.668563+03
54	11	4	\N	\N	\N	\N	t	2025-09-12 20:59:20.668563+03
55	11	5	\N	\N	\N	["walk_in"]	f	2025-09-12 20:59:20.668563+03
56	12	1	\N	4	\N	\N	f	2025-09-12 21:28:16.613779+03
57	12	2	\N	\N	\N	["battle_diorama"]	f	2025-09-12 21:28:16.613779+03
58	12	3	\N	\N	t	\N	f	2025-09-12 21:28:16.613779+03
59	12	4	\N	\N	\N	\N	t	2025-09-12 21:28:16.613779+03
60	12	5	\N	\N	\N	["walk_in"]	f	2025-09-12 21:28:16.613779+03
61	13	1	\N	4	\N	\N	f	2025-09-13 00:36:58.091877+03
62	13	2	\N	\N	\N	["art_gallery"]	f	2025-09-13 00:36:58.091877+03
63	13	3	\N	\N	t	\N	f	2025-09-13 00:36:58.091877+03
64	13	4	\N	\N	\N	\N	t	2025-09-13 00:36:58.091877+03
65	13	5	\N	\N	\N	["walk_in"]	f	2025-09-13 00:36:58.091877+03
66	14	1	\N	4	\N	\N	f	2025-09-13 00:40:33.79784+03
67	14	2	\N	\N	\N	["battle_diorama"]	f	2025-09-13 00:40:33.79784+03
68	14	3	\N	\N	t	\N	f	2025-09-13 00:40:33.79784+03
69	14	4	\N	\N	\N	\N	t	2025-09-13 00:40:33.79784+03
70	14	5	\N	\N	\N	["word_of_mouth"]	f	2025-09-13 00:40:33.79784+03
71	15	1	\N	4	\N	\N	f	2025-09-13 00:43:09.203074+03
72	15	2	\N	\N	\N	["art_gallery"]	f	2025-09-13 00:43:09.203074+03
73	15	3	\N	\N	t	\N	f	2025-09-13 00:43:09.203074+03
74	15	4	\N	\N	\N	\N	t	2025-09-13 00:43:09.203074+03
75	15	5	\N	\N	\N	["walk_in"]	f	2025-09-13 00:43:09.203074+03
76	16	1	\N	4	\N	\N	f	2025-09-13 00:46:01.291674+03
77	16	2	\N	\N	\N	["art_gallery"]	f	2025-09-13 00:46:01.291674+03
78	16	3	\N	\N	t	\N	f	2025-09-13 00:46:01.291674+03
79	16	4	\N	\N	\N	\N	t	2025-09-13 00:46:01.291674+03
80	16	5	\N	\N	\N	["walk_in"]	f	2025-09-13 00:46:01.291674+03
81	17	3	yes	\N	\N	\N	f	2025-09-13 01:09:21.595464+03
82	17	6	\N	4	\N	\N	f	2025-09-13 01:09:21.595464+03
83	17	7	\N	\N	\N	["art_gallery"]	f	2025-09-13 01:09:21.595464+03
84	17	9	\N	\N	\N	\N	t	2025-09-13 01:09:21.595464+03
85	17	10	\N	\N	\N	["word_of_mouth"]	f	2025-09-13 01:09:21.595464+03
86	18	6	\N	4	\N	\N	f	2025-09-13 01:13:01.972537+03
87	18	7	\N	\N	\N	["battle_diorama"]	f	2025-09-13 01:13:01.972537+03
88	18	8	\N	\N	t	\N	f	2025-09-13 01:13:01.972537+03
89	18	9	\N	\N	\N	\N	t	2025-09-13 01:13:01.972537+03
90	18	10	\N	\N	\N	["word_of_mouth"]	f	2025-09-13 01:13:01.972537+03
91	19	6	\N	4	\N	\N	f	2025-09-13 01:13:41.75536+03
92	19	7	\N	\N	\N	["art_gallery"]	f	2025-09-13 01:13:41.75536+03
93	19	8	\N	\N	t	\N	f	2025-09-13 01:13:41.75536+03
94	19	9	\N	\N	\N	\N	t	2025-09-13 01:13:41.75536+03
95	19	10	\N	\N	\N	["walk_in"]	f	2025-09-13 01:13:41.75536+03
96	20	1	\N	4	\N	\N	f	2025-09-15 20:39:46.210826+03
97	20	2	\N	\N	\N	["art_gallery"]	f	2025-09-15 20:39:46.210826+03
98	20	3	\N	\N	t	\N	f	2025-09-15 20:39:46.210826+03
99	20	4	\N	\N	\N	\N	t	2025-09-15 20:39:46.210826+03
100	20	5	\N	\N	\N	["word_of_mouth"]	f	2025-09-15 20:39:46.210826+03
101	21	1	\N	5	\N	\N	f	2025-09-15 20:41:46.230949+03
102	21	2	\N	\N	\N	["battle_diorama"]	f	2025-09-15 20:41:46.230949+03
103	21	3	\N	\N	t	\N	f	2025-09-15 20:41:46.230949+03
104	21	4	\N	\N	\N	\N	t	2025-09-15 20:41:46.230949+03
105	21	5	\N	\N	\N	["social_media"]	f	2025-09-15 20:41:46.230949+03
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
40	5
41	5
41	8
41	4
42	8
26	5
26	6
44	10
38	5
38	7
45	5
45	6
45	2
45	3
47	9
47	10
47	11
48	6
48	3
48	10
49	5
49	7
49	8
49	2
26	7
26	16
50	6
50	7
50	2
50	3
51	5
25	5
25	6
25	7
25	2
25	3
25	9
25	10
25	11
25	12
25	13
25	14
25	15
25	8
25	18
25	16
25	17
25	19
25	20
25	21
25	22
25	23
25	24
25	25
25	26
25	27
25	28
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name) FROM stdin;
25	admin
26	ticketOperator
40	rolenow2
41	rolenow3
42	norole
44	Administrator92
38	addisRolerole
45	ITDB
46	role 8
47	role 9
48	role 19
49	role 91
50	admin34
51	admin1234
\.


--
-- Data for Name: service_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_category (id, category, description, created_at, updated_at, status, is_deleted, category_am, description_am) FROM stdin;
2	dfgdfg	dfsdf	2025-09-01 19:02:57.107711	2025-09-01 19:02:57.107711	active	t	\N	\N
4	sdfs123	Premium Services	2025-09-03 11:24:36.762448	2025-09-03 11:24:36.762448	active	f	a1m	d2m
5	new	new des	2025-09-10 00:41:10.006589	2025-09-10 00:41:10.006589	active	t	am	desdm
3	Exibition	new	2025-09-02 17:46:18.054519	2025-09-02 17:46:18.054519	active	f	 ኤግዚቢሽን	 ኤግዚቢሽን1
1	Event	new	2025-09-01 18:34:27.715925	2025-09-01 18:34:27.715925	active	f	ሁነት	 ኤግዚቢሽን1
\.


--
-- Data for Name: service_facility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_facility (id, category_id, venue_id, price, currency, duration, features, capacity, status, is_deleted, created_at, updated_at, image, description, video, description_am, features_am) FROM stdin;
13	4	6	300.00	ETB	per_hour	new, bad, okd	600	active	t	2025-09-10 01:17:42.100599	2025-09-10 01:25:39.828045	http://localhost:8080/uploads/service-letters/bar-chart-1757456261738.png	new	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757456261740.mp4	old 	old, mju, mj, jh
14	4	8	56.00	ETB	per_hour	dfgdfg, fhfgh, jyi	67	active	t	2025-09-10 01:25:18.828083	2025-09-10 01:25:28.691785	http://localhost:8080/uploads/service-letters/pie-chart (1)-1757456718686.png	new	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757456718689.mp4	dfgdgdg	asdasd, hfghf, ghty
11	4	8	400.00	ETB	per_day	aws, asw	200	active	t	2025-09-03 11:28:42.176312	2025-09-03 18:15:41.611515	http://localhost:8080/uploads/content-images/621d4c714c938f03e7558ee7ef29782e	\N	\N	\N	\N
9	3	6	200.00	USD	per_day	best	200	active	t	2025-09-02 17:46:55.207352	2025-09-03 00:23:59.551851	http://localhost:8080/uploads/content-images/b337e24fb6f38b6b9a4ffd58a7e29435	\N	\N	\N	\N
10	3	6	200.00	ETB	per_hour	wifi, Speakers	200	active	t	2025-09-03 00:25:02.733133	2025-09-03 00:26:31.023509	http://localhost:8080/uploads/content-images/da741c42e78abe4d6265e6439f52da8d	\N	\N	\N	\N
12	3	8	500.00	ETB	per_hour	wifi, speakers	300	active	f	2025-09-09 00:47:22.070897	2025-09-10 18:12:38.789095	http://localhost:8080/uploads/service-letters/digital-1757368041740.jpg	adfasfasdfsff\r\nsdfsfsfsf	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757368041827.mp4	 ኤግዚቢሽን	በጣም, ጥሩy
5	1	9	45.00	ETB	per_hour	gdfg	345	active	t	2025-09-02 16:23:41.715549	2025-09-02 17:30:05.926983	\N	\N	\N	\N	\N
7	1	9	45.00	ETB	per_hour	new	200	active	t	2025-09-02 17:30:27.920521	2025-09-02 17:36:18.502834	\N	\N	\N	\N	\N
4	1	6	10000.00	ETB	per_hour	new	500	active	f	2025-09-01 19:19:37.27727	2025-09-10 17:22:56.974981	http://localhost:8080/uploads/content-images/2f6dde14ed7a17852c96f2fa0817e31d	good	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757368270659.mp4	\r\nጥሩ	አዲስ, ጥሩ
8	1	9	200.00	ETB	per_hour	ghj	200	active	f	2025-09-02 17:36:44.6161	2025-09-10 17:26:24.106545	http://localhost:8080/uploads/content-images/c2c7a01512b54779296aa42a3740d1d7	new	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757374312233.mp4	አዲስ	አሮጌ, ወርቅ
3	1	6	100.00	ETB	per_hour	best	100	active	t	2025-09-01 18:47:49.75081	2025-09-01 19:07:44.798407	\N	\N	\N	\N	\N
6	1	8	10.00	ETB	per_hour	good, best	300	active	f	2025-09-02 17:25:42.908451	2025-09-13 00:27:04.853076	http://localhost:8080/uploads/content-images/ca7b56bb2a24072a5859aed6b1cf8f6b	best	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757368301578.mp4	new	በጣም, ጥሩ
2	1	8	2000.00	USD	per_day	good, bad, best	400	active	t	2025-09-01 18:44:39.474005	2025-09-02 17:24:11.235233	\N	\N	\N	\N	\N
15	3	9	10.00	ETB	per_hour	sf	500	active	f	2025-09-15 20:32:52.893497	2025-09-15 20:32:52.893497	http://localhost:8080/uploads/service-letters/wallpaperflare.com_wallpaper (4)-1757957572435.jpg	des	http://localhost:8080/uploads/service-letters/vlc-record-2024-07-29-01h36m33s-torrentgalaxy.to _ 1883.S01E06.WEB.x264-TORRENTGALAXY--1757957572454.mp4	des	sf
\.


--
-- Data for Name: service_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_feedback (feedback_id, request_id, rating, comment, created_at, status) FROM stdin;
1	1	5	Great service and venue!	2025-07-23	Reviewed
\.


--
-- Data for Name: service_module; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_module (service_id, name, description, icon, status, created_at, updated_at) FROM stdin;
1	Catering	Food and beverage service	🍽️	Active	2025-07-23 15:22:40.333764	2025-07-23 15:22:40.333764
2	AV Equipment	Audio visual support	🎤	Active	2025-07-23 15:22:40.333764	2025-07-23 15:22:40.333764
\.


--
-- Data for Name: service_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_request (request_id, facility_id, user_id, org_name, contact_person, email, phone_no, event_type, expected_atendee, special_request, date, start_time, end_time, created_at, updated_at, to_be_paid, status) FROM stdin;
1	1	3	TechOrg	Carol White	carol@example.com	1122334455	Tech Conference	150	Need vegetarian meals	2025-07-23	2025-07-23 15:22:40.333764+03	2025-07-23 18:22:40.333764+03	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03	1500.00	Pending
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_requests (id, org_name, contact_person, email, phone_no, exp_attendees, venue, category, status, created_at, updated_at, paid, amount, currency, file, payment_window, approved_at, tx_ref, payment_flag) FROM stdin;
101	approved at testing 2	luhena abebe	luhenaabebe086@gmail.com	0912345678	70	conference hall	Event	approved	2025-09-06 22:23:38.398705	2025-09-06 22:38:28.494086	f	14400.00	ETB	http://localhost:8080/uploads/service-letters/confirmation-tx-adwamuseum-53fc9947-4668-48a3-a74e-6500aeef6906-1757186618275.pdf	00:01:00	2025-09-06 22:38:28.494086	\N	t
18	ch3	dfg	dfg@g.no	0912345678	23	main halls2	Exhibition	rejected	2025-09-01 02:59:27.411447	2025-09-01 02:59:27.411447	t	200	ETB	\N	2 days	\N	\N	t
30	Addis	luuhena	lyts@gmail.com	0912345678	200	main halls2	Event	approved	2025-09-03 02:25:14.575784	2025-09-03 02:25:14.575784	t	200	ETB	\N	2 days	\N	\N	t
97	Owix and LYTS plc123	Mahider Jemere	luhenaabebe086@gmail.com	0912345678	90	conference hall	Event	approved	2025-09-06 18:48:56.192863	2025-09-06 18:50:38.884872	t	1200.000000000000000000	ETB	http://localhost:8080/uploads/service-letters/qw-1757173735921.pdf	2 days	2025-09-06 18:50:23.997313	tx-adwamuseum-638fcd6d-ac9c-4baa-b8db-231f9ad7bbf3	t
49	fsdfsdf	sdf	ssfs@sdgh.fgh	0912345678	78	main halls2	Exibition	approved	2025-09-04 22:12:42.781853	2025-09-05 11:59:52.735186	t	200	ETB	\N	2 days	\N	\N	t
102	Owix and LYTS plc	luhena abebe	luhenaabebe086@gmail.com	0912345678	89	conference hall	Event	draft	2025-09-07 00:34:39.137808	2025-09-07 00:48:33.866025	f	14400.00	ETB	http://localhost:8080/uploads/service-letters/adwa-warriors-day-1757194479060.jpeg	2 days	\N	\N	t
100	approved at testing 1	Mahider Jemere	luhenaabebe086@gmail.com	0912345678	90	conference hall	Event	approved	2025-09-06 22:06:47.682888	2025-09-06 22:18:40.749039	t	14400.00	ETB	http://localhost:8080/uploads/service-letters/confirmation-tx-adwamuseum-53fc9947-4668-48a3-a74e-6500aeef6906-1757185607374.pdf	00:01:00	2025-09-06 22:18:03.904447	tx-adwamuseum-6232ce86-7f8a-49d2-be2f-8deaaed3f523	t
103	new test 123	luhena abebe1	luhenaabebe086@gmail.com	0912345678	556	conference hall	Event	draft	2025-09-07 01:50:22.7875	2025-09-07 01:50:22.814313	f	14400.00	ETB	http://localhost:8080/uploads/service-letters/adwa-warriors-day-1757199022577.jpeg	2 days	\N	\N	t
98	draft check 1	Mahider Jemere	luhenaabebe086@gmail.com	0912345678	23	conference hall	Event	approved	2025-09-06 19:37:24.565043	2025-09-06 20:22:29.862235	t	15600.000000000000000000	ETB	http://localhost:8080/uploads/service-letters/confirmation-tx-adwamuseum-53fc9947-4668-48a3-a74e-6500aeef6906-1757176644314.pdf	2 days	2025-09-06 20:22:04.234928	tx-adwamuseum-29a258ba-202a-498f-84f3-87b739fe7432	t
104	Owix and LYTS plc	Mahider Jemere	luhenaabebe086@gmail.com	0912345678	90	conference hall	Event	draft	2025-09-07 11:54:45.623685	2025-09-07 11:54:45.647699	f	14400.00	ETB	http://localhost:8080/uploads/service-letters/adwa-warriors-day-1757235285528.jpeg	2 days	\N	\N	t
17	and	lhead	lyts@gma.com	0912345678	100	main halls2	Event	approved	2025-09-01 01:36:33.006886	2025-09-01 01:36:33.006886	t	200	ETB	\N	2 days	\N	\N	t
93	new test	name	yts@fdkl.com	0912345678	78	conference hall	sdfs123	approved	2025-09-06 17:59:33.940982	2025-09-06 18:06:30.037405	f	200	ETB	http://localhost:8080/uploads/service-letters/confirmation-tx-adwamuseum-a3612d7a-1628-41a4-99d2-a6cde507a337-1757170853526.pdf	2 days	2025-09-06 18:06:30.037405	\N	t
10	Owix	luhena abebe	luhen@gmail.ocm	0912345678	200	conference hall	Event	approved	2025-08-31 16:55:36.47973	2025-09-06 02:20:52.733512	f	200	ETB	\N	2 days	2025-09-06 02:20:52.733512	\N	t
12	Org 2	Soyam abebe	lytsman5@gmail.com	0912345678	200	main halls2	Exhibition	approved	2025-08-31 19:16:17.959913	2025-08-31 19:16:17.959913	t	200	ETB	\N	2 days	\N	\N	t
15	check	check	lyts@man.com	0912345678	100	main halls2	Event	approved	2025-08-31 22:51:53.625961	2025-08-31 22:51:53.625961	t	200	ETB	\N	2 days	\N	\N	t
133	ITDB 	luhena abebe	abebetamrat21@gmail.com	0912345678	200	conference hall	Event	pending	2025-09-15 20:06:16.586905	2025-09-15 20:07:22.418257	f	14400.00	ETB	http://localhost:8080/uploads/service-letters/report template-1757955976533.docx	2 days	\N	\N	t
32	gdfgq123	dfg	dfg@eer.com	0912345678	300	conference hall	sdfs123	rejected	2025-09-03 18:44:26.147586	2025-09-06 02:41:53.659108	f	200	ETB	null	2 days	2025-09-06 02:41:46.045782	\N	t
29	ITDB	john doe	john@email.com	0912345678	200	main halls2	Event	approved	2025-09-02 23:49:49.199884	2025-09-02 23:49:49.199884	t	200	ETB	\N	2 days	\N	\N	t
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, description, price) FROM stdin;
\.


--
-- Data for Name: social_media_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_media_links (id, platform, url, icon_class, display_order, is_active, created_at, updated_at) FROM stdin;
1	facebook	https://facebook.com/adwamuseum	facebook	0	t	2025-08-24 01:22:22.819349	2025-08-24 01:22:22.819349
2	twitter	https://twitter.com/adwamuseum	twitter	1	t	2025-08-24 01:22:22.819349	2025-08-24 01:22:22.819349
3	instagram	https://instagram.com/adwamuseum	instagram	2	t	2025-08-24 01:22:22.819349	2025-08-24 01:22:22.819349
4	youtube	https://youtube.com/adwamuseum	youtube	3	t	2025-08-24 01:22:22.819349	2025-08-24 01:22:22.819349
\.


--
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_questions (id, survey_id, ordinal, type, prompt, required, meta, created_at, updated_at, is_deleted) FROM stdin;
1	1	1	emoji-rating	How would you rate your overall experience at the Adwa Museum?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
2	1	2	multiple-choice	Which exhibit did you find most interesting?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
3	1	3	yes-no	Would you recommend the Adwa Museum to others?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
4	1	4	text	What suggestions do you have to improve the museum experience?	f	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
5	1	5	multiple-choice	How did you hear about the Adwa Museum?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
6	2	1	emoji-rating	የአድዋ ሙዚየም ጉብኝትዎን በአጠቃላይ እንዴት ይገምታሉ?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
7	2	2	multiple-choice	የትኛው ማሳያ በጣም አስደሳች ነበር?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
8	2	3	yes-no	አድዋ ሙዚየም ለሌሎች ይመክራሉ?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
9	2	4	text	የሙዚየም ተሞክሮን ለማሻሻል ምን ማድረግ ይጠቁማሉ?	f	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
10	2	5	multiple-choice	ስለ አድዋ ሙዚየም እንዴት አወቁ?	t	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03	f
\.


--
-- Data for Name: surveys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.surveys (id, title, description, language, is_active, version, settings, created_at, updated_at) FROM stdin;
2	የአድዋ ሙዚየም የተጎብኙት አስተያየት	ከሙዚየም ተጎብኝተው የሚመጡትን አስተያየት ለመሰብሰብ	am	t	1	{}	2025-09-12 17:52:43.0635+03	2025-09-12 17:52:43.0635+03
1	Adwa Museum Visitor Feedback	Collect feedback from museum visitors	en	t	1	{}	2025-09-12 17:52:43.0635+03	2025-09-13 22:50:35.292655+03
\.


--
-- Data for Name: ticket_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_types (ticket_id, event_id, type, price, description, feature, daily_limit, status, step, is_deleted, last_reset_date, daily_limit_orig, currency, type_am, description_am, features_am) FROM stdin;
4	879	student	100	Discounted ticket for students	Valid ID Required	178	active	1	f	2025-09-15	200	ETB	የተማሪ	\N	\N
5	89	tourist	300	Standard ticket for international/local tourists	Self-guided Access	193	active	1	f	2025-09-15	200	USD	ጎብኚ	\N	\N
15	\N	test2	500	amharic2	Entry only, new 	70	Active	\N	t	2025-09-15	70	ETB	test am23	am2	new, old
13	123	new1234	300	VIP ticket with lounge access	Priority, seating	200	Active	\N	t	2025-09-15	200	USD	test am1	am21	new, old1
8	123	AWAKI	4	VIP ticket with lounge access	adult,something	200	Active	\N	t	2025-09-15	200	ETB	\N	\N	\N
1	1	Standard	300	Standard ticket	Entry only	200	Inactive	1	f	2025-09-15	200	ETB	መደበኛ	\N	\N
6	123	VVIP	600	other ticket	For-all	195	active	3	f	2025-09-15	200	ETB	\N	\N	\N
3	87	premium	500	Access to exclusive areas and guided tour	VIP Access, Priority Entry	195	active	1	f	2025-09-15	200	ETB	\N	\N	\N
2	1	VIP	500	VIP ticket with lounge access	Priority seating	196	Active	1	f	2025-09-15	200	ETB	ከአሰ	\N	\N
\.


--
-- Data for Name: unavailable_dates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unavailable_dates (id, venue_id, date, weekly_recurrence, monthly_recurrence) FROM stdin;
300	8	2025-09-10	0	0
301	8	2025-09-25	0	0
400	8	2025-09-17	\N	\N
401	6	2025-09-25	2	\N
402	8	2025-09-26	\N	\N
129	6	2025-08-21	\N	\N
130	6	2025-08-22	\N	\N
131	6	2025-08-24	2	\N
132	6	2025-08-31	\N	\N
403	6	2025-09-17	\N	\N
404	6	2025-10-10	2	\N
309	8	2025-09-20	0	0
138	6	2025-08-20	\N	\N
310	8	2025-09-30	0	0
141	6	2025-08-30	\N	\N
143	6	2025-08-29	\N	\N
145	6	2025-08-27	2	\N
316	8	2025-09-21	0	0
317	8	2025-10-15	0	0
320	9	2025-09-21	0	0
321	9	2025-10-15	0	0
350	6	2025-09-23	0	0
351	8	2025-09-27	0	0
353	6	2025-09-03	0	0
354	6	2025-09-26	0	0
355	6	2025-09-28	0	0
356	6	2025-09-20	0	0
357	6	2025-09-30	0	0
358	6	2025-09-10	0	0
359	6	2025-09-11	0	0
360	6	2025-09-14	0	0
361	6	2025-09-27	0	0
362	6	2025-09-15	0	0
363	8	2025-09-12	0	0
365	9	2025-09-30	0	0
366	9	2025-09-10	0	0
367	9	2025-09-11	0	0
368	9	2025-09-08	0	0
369	9	2025-09-24	0	0
370	9	2025-09-27	0	0
371	8	2025-10-25	0	0
372	8	2025-10-31	0	0
373	8	2025-09-29	0	0
374	8	2025-10-10	0	0
376	8	2025-10-01	0	0
377	8	2025-10-12	0	0
378	8	2025-10-22	0	0
379	8	2025-10-29	0	0
383	8	2025-09-23	0	0
384	8	2025-09-24	0	0
385	8	2025-09-18	0	0
386	8	2025-09-08	0	0
387	8	2025-09-09	0	0
388	8	2025-09-13	0	0
389	8	2025-10-27	0	0
390	6	2025-09-06	\N	\N
391	8	2025-11-01	0	0
392	8	2025-09-11	0	0
394	8	2025-11-20	0	0
\.


--
-- Data for Name: unavailable_time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unavailable_time_slots (id, unavailable_date_id, start_time, end_time) FROM stdin;
160	132	14:00:00	16:30:00
158	143	12:00:00	16:00:00
159	130	14:00:00	23:30:00
156	138	08:00:00	23:30:00
162	145	08:00:00	11:00:00
163	145	11:00:00	18:30:00
575	357	00:00:00	00:30:00
576	359	00:00:00	02:00:00
579	359	03:00:00	04:30:00
580	362	00:00:00	01:30:00
581	350	00:00:00	00:30:00
584	365	00:00:00	00:30:00
585	367	00:00:00	00:30:00
587	320	00:00:00	00:30:00
589	370	00:00:00	01:00:00
591	371	00:00:00	01:00:00
592	372	00:00:00	01:00:00
603	300	00:00:00	01:00:00
604	373	00:00:00	00:30:00
832	371	02:00:00	03:00:00
142	129	08:30:00	16:00:00
509	350	03:00:00	04:00:00
511	351	21:30:00	22:30:00
1309	377	00:00:00	01:00:00
146	131	08:00:00	10:00:00
147	132	08:00:00	10:00:00
148	132	12:00:00	14:00:00
1310	377	01:00:00	02:00:00
1311	371	03:00:00	04:00:00
151	130	12:00:00	14:00:00
522	353	07:00:00	10:00:00
1312	372	01:30:00	02:30:00
1329	377	02:00:00	04:30:00
1330	377	04:30:00	05:00:00
1331	379	00:00:00	00:30:00
1332	379	00:30:00	04:30:00
1337	300	01:30:00	02:30:00
445	300	21:00:00	22:30:00
1338	384	00:00:00	01:00:00
1339	385	00:00:00	01:00:00
1350	387	00:00:00	00:30:00
1352	387	01:30:00	02:00:00
1354	300	04:00:00	05:00:00
1455	351	00:00:00	02:00:00
1457	379	04:30:00	06:30:00
453	316	21:00:00	21:30:00
455	320	21:00:00	21:30:00
577	353	10:00:00	10:30:00
1463	400	08:00:00	23:00:00
1464	402	08:00:00	13:00:00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, fname, lname, email, phone_no, password, created_at, updated_at, gender, username, profile_image) FROM stdin;
1	Alice	Smith	alice@example.com	1234567890	hashedpass1	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03	Female	\N	\N
2	Bob	Johnson	bob@example.com	0987654321	hashedpass2	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03	Male	\N	\N
3	Carol	White	carol@example.com	1122334455	hashedpass3	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03	Female	\N	\N
4	David	Lee	david@example.com	5566778899	hashedpass4	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03	Male	\N	\N
7	Selam	Tesfaye	selam@example.com	0911223344	$2b$10$Wd07a1gRpQXGkVpNN/6GC.JTQ9Uckg6toZPXKGlGz3nvvA8mPBChC	2025-07-28 10:39:43.037181+03	2025-07-28 10:39:43.037181+03	Female	selamAdmin	\N
14	someone	someone	mahiderjemere12@gmail.com	+251926976771	$2b$10$mlFLBAgzA2gb2ktavFpZ5uxeJzJPyJ53WZaP3wJ237VmebR0k8YVa	2025-07-29 13:16:40.932126+03	2025-07-29 13:16:40.932126+03	Female	someone.someone970	\N
15	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$1VUBjgAOd0pk0OJ36p0q2.vF9XM7QdnD.VtmcAXUQHWIDaGHCqsaG	2025-07-29 13:28:48.406051+03	2025-07-29 13:28:48.406051+03	Male	mahider.sharew509	\N
16	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$0TzpbhVWsfNkH328JuaIH.21y3Mon3S4JMLp5mnGKA5DLF5.JPJvG	2025-07-29 13:53:04.315631+03	2025-07-29 13:53:04.315631+03	Male	mahider.sharew589	\N
17	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$IsRb.HHoBW9njfGC1PUpfObc9A8NepsI5R.WlhkYz./l.oDZotCEm	2025-07-29 13:57:46.145928+03	2025-07-29 13:57:46.145928+03	Male	mahider.sharew702	\N
18	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$VCD2Gdee/023VvQJvZ7PjuTAucu1edz6IpcI8.lJvvs3xvKzWmbq.	2025-07-29 13:58:49.128171+03	2025-07-29 13:58:49.128171+03	Male	mahider.sharew980	\N
19	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$I8RzH1GKqQzZ/Ngvy/BJSuMZJaZHRZ8z9kUkvKBn8kQNf8Cf0DvOS	2025-07-29 14:02:03.578227+03	2025-07-29 14:02:03.578227+03	Male	mahider.sharew318	\N
22	Mahider3	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$6I8Pdpu5Rx6NDDUtX7roVemAcXv9YD.dNOoOSYeut01j5c5pA7.g6	2025-07-29 14:19:06.654709+03	2025-07-29 14:19:06.654709+03	Male	mahider3.sharew421	\N
23	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$uOHRRxK9wfMHLIPwTONky.LDeErTcthI2TdAy/OrDHi/mXS7v1dey	2025-07-29 17:18:18.750912+03	2025-07-29 17:18:18.750912+03	Male	mahider.sharew644	\N
24	Mahider	Yizengaw	mahiderjemere12@gmail.com	+251926976771	$2b$10$rAFYAZsqt8wlVuemgb8xIOsNkY98lg9QkORRrleo8iwBQR0UVoz62	2025-07-29 17:19:17.910985+03	2025-07-29 17:19:17.910985+03	Male	mahider.yizengaw350	\N
26	lelasew	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$4X5rkFgGcZaIeM1HpR3uL.xhxew82Pd9CcslWaTfyfvaqOv1RJqoe	2025-07-29 17:49:11.289147+03	2025-07-29 17:49:11.289147+03	Male	lelasew.sharew346	\N
27	other	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$ZqruIWR1zBMBzEtV2Iwd/Opppbx8bHNz1Gtwr/EZi2XaNW4KmV3ve	2025-07-29 17:52:13.856707+03	2025-07-29 17:52:13.856707+03	Male	other.sharew988	\N
28	lelasew2	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$ZZ9Xo4RhQd.9sKHxiz/Lcu0MEk1ieI6HcsKTuFX99rwRYZ3VL5Tg.	2025-07-29 17:55:29.459475+03	2025-07-29 17:55:29.459475+03	Male	lelasew2.sharew565	\N
30	someone2	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$0KwykpVWVj8.dEcAVhuuP.4Yi83CqvhX8V.8z8m6/K4tdWl8PIcjm	2025-07-29 18:02:45.048253+03	2025-07-29 18:02:45.048253+03	Male	someone2.sharew556	\N
31	someone3	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$mQLzmpEfR/RLC56L0Hz91e8wsLTqGkUgvblaBESwoQi.4kv7dqZGO	2025-07-29 18:05:00.883835+03	2025-07-29 18:05:00.883835+03	Male	someone3.sharew650	\N
32	Mahider	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$Chn.hK.wXVlGSmfB/oWo6Odw9KMDdViQkannYEX9UqbiYguW9OKR6	2025-07-29 18:18:46.255519+03	2025-07-29 18:18:46.255519+03	Male	mahider.sharew387	\N
33	Mahider2121211	Sharew	mahiderjemere12@gmail.com	+251926976771	$2b$10$UOrq.ARMAgCE8gr3MjL.8OFnN.oC8owlMDOgItOZf4SC/cNXOHumq	2025-07-29 18:44:03.783593+03	2025-07-29 18:44:03.783593+03	Male	mahider2121211.sharew916	\N
29	MahBlo	Yizen	lytsman56@gmail.com	+251926976771	$2b$10$c3E4yNVh2V7QRIKRSlHNveGaHuk5YGui8OP02ppJLN/fyHy4aIFdG	2025-07-29 17:58:18.34615+03	2025-07-29 17:58:18.34615+03	Female	mahblonde.yiz986	\N
34	Mahider	vfrfd	mahiderjemere12@gmail.com	+251926976771	$2b$10$FWeaTlOfEQxHCqFIIJ3n7uU136R4stmfHOggeypgsZ0YSxp1b0K62	2025-07-29 18:50:37.944466+03	2025-07-29 18:50:37.944466+03	Male	mahider.sharew694	\N
20	Mahider1	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$6TjpW.mMoK3qPQZE5z4Sbext.RQPAe0AxqOxqPNe2sXnOmcEU9XOe	2025-07-29 14:18:10.064566+03	2025-07-29 14:18:10.064566+03	Male	mahider1.sharew144	\N
46	Mahider Sharew	Mahider Sharew	mahideryizengaw69@gmail.com	0926976771	$2b$10$O2ZryyAsvsZBZurNLcsQ1.SjDeGO7P2sh4HVcpf9Ot/BYipXdDWzG	2025-08-06 02:49:55.297544+03	2025-08-06 02:49:55.297544+03	Male	\N	\N
47	Mahider Sharew	Mahider Sharew	finotmahy@gmail.com	0926976771	$2b$10$I0oAnSD9Kyn0VwEpB5Sm2eGf5spKzWQVZzBVcf8ck9bkQGdsX0Gc6	2025-08-06 02:54:41.636451+03	2025-08-06 02:54:41.636451+03	Male	\N	\N
49	ITDB	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$tR/8mSbLf1sQPIFSPeoNnemc6iW4HDRoLyDJqxs4/AaplYrb8DA0K	2025-08-06 11:32:04.174226+03	2025-08-06 11:32:04.174226+03	Male	itdb.sharew836	\N
50	someone	mighty	lytsman56@gmail.com	+251926976771	$2b$10$povZeqKMEcWEb1rf7hnXue1XecGOE1X3wqeSvGHHWlB7NGhaIOsBK	2025-08-12 22:58:27.239223+03	2025-08-12 22:58:27.239223+03	Male	someone.mighty839	\N
10	Ticket	Man	ticketman@adwa.com	0911223344	$2b$10$sdMM52NJBH7rgLHdm4L.IOo5kOgrBpFyfPsf4pzAoBkz3OeIja3EC	2025-07-28 22:59:42.42282+03	2025-07-28 22:59:42.42282+03	Male	ticketMan	\N
55	Luhena	Abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$HkdeH1Oa1uuk/LyOc4GV8uBGf/eVd9sGZYUUflg68./APlM7VEVEa	2025-08-16 21:07:26.389792+03	2025-08-16 21:07:26.389792+03	Male	luhena.abebe804	\N
57	Sofonyas	Yared	sofonyasyared66@gmail.com	0912121212	$2b$10$1ygZBT6BE9hH5F7IeMMHJOBBQq1BK4sZYkN4Kbc80ZPkr.ij4dtTy	2025-08-21 14:19:07.62792+03	2025-08-21 14:19:07.62792+03	Male	sofonyas.yared383	uploads\\profile_images\\8d5bed5b03593947aa30ee7098c7bf51
56	luhena	abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$quDIjyAEl5DRnuhhShjbbe6r.kEBbAc9FpPl5C2gKjKiNufAFKEiK	2025-08-21 14:03:45.537797+03	2025-08-21 14:03:45.537797+03	Male	luhena.abebe863	uploads\\profile_images\\e790082bc41602042892cda6ff342845
58	luhena	abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$DKcvPFnMArZBGW.FliLVN.0N73Ej/dIdiib0CamLn7Zps4G8aU3Lu	2025-08-25 11:11:36.349519+03	2025-08-25 11:11:36.349519+03	Male	luhena.abebe330	\N
60	await	Yared	luhenaabebe086@gmail.com	0912121212	$2b$10$jQpz1npxaA3yP31AbWNwyuIh2CxEJBlJLNXhL.7vBGdPPzMIpWUCC	2025-08-30 20:49:09.258095+03	2025-08-30 20:49:09.258095+03	Male	await.yared690	\N
48	luhena abebe	luhena abebe	luhenaabebe086@gmail.com	0926976771	$2b$10$6YmoY.o9xxJDchO9V1Rxu.d7kmHauuCpRlF4rlEynDter9g0kMei6	2025-08-06 11:17:23.756877+03	2025-08-06 11:17:23.756877+03	Male	\N	\N
59	staff	abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$QRXuNhFbQ3c.4ZvVMCeSzuC3NJmqRArSxFWX7x.DDftBBrebLx8oe	2025-08-30 20:47:21.870197+03	2025-08-30 20:47:21.870197+03	Male	staff.abebe704	\N
61	luhena abebe	luhena abebe	luhenaabebe@gmail.com	0944357340	$2b$10$nAW8f2Q9buTQs2.RCQ9/xuGbuzsxcZB.SN3VRzLErbfki1C7YZQtu	2025-09-01 23:52:51.35322+03	2025-09-01 23:52:51.35322+03	Male	\N	\N
62	Tamrat	Abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$KPdfkbdFKqqJueetKe8gHOSD3YKLK500RSskaoeJbpKwmdlcWr0va	2025-09-03 00:32:43.686416+03	2025-09-03 00:32:43.686416+03	Male	tamrat.abebe894	\N
21	Mahider2	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$hwZFXcaLO9qr7ti6Ikag2uWczhJF27d3m52qz.ph0f5cvnDbv//lq	2025-07-29 14:18:42.260742+03	2025-07-29 14:18:42.260742+03	Male	mahider2.sharew858	\N
25	Mahider5	Sharew	lytsman56@gmail.com	+251926976771	$2b$10$6vnEwyS.roWeNn3LG1w.XuIp498FDPTU7GeNoOfXpuWQUHLLvT3rC	2025-07-29 17:24:16.121271+03	2025-07-29 17:24:16.121271+03	Male	mahider5.sharew667	\N
63	Luhena Abebe	Luhena Abebe	mahderyizengaw69@gmail.com	0944357340	$2b$10$WY7nPyh/wupM8Zt3jXFz3O82Z5HpvgmMPn43VJ6O7GrtyWM0S6X3m	2025-09-03 12:39:55.123926+03	2025-09-03 12:39:55.123926+03	Male	\N	\N
54	mahider	Abebe	luhenaabebe086@gmail.com	0944357340	$2b$10$IwgVVdre8kYBuLBXtNFHkOFg.94K3skIxvLEPUVJElsbUi12tkljq	2025-08-14 22:35:57.237719+03	2025-08-14 22:35:57.237719+03	Male	mahider.abebe124	\N
64	Sofonyas111	Yared	luhenaabebe086@gmail.co	0912121210	$2b$10$YWcm7ZAGZYGz/9EPyK6EZO9ljcbEc.3hpOHtm1rAS7asLIGA/2PAi	2025-09-07 01:42:58.092565+03	2025-09-07 01:42:58.092565+03	Male	sofonyas.yared759	\N
65	luhena	Abebe	luhenabebe086@gmail.co	0912121212	$2b$10$GJ59NR.CexIk.8Nbm4HrGeH0.5CyyBfQwaGDPtr5Gkk39NyfV/2pC	2025-09-07 02:20:52.642274+03	2025-09-07 02:20:52.642274+03	Male	luhena.yared812	\N
66	luhena	Abebe	owix12@gmail.com	0912121212	$2b$10$8YYdWDc5sHLm86gPK6NwIO7amq4GjSgGPZhHU/upfEqe6QNDgYxh2	2025-09-07 11:28:50.318921+03	2025-09-07 11:28:50.318921+03	Male	luhena.abebe579	\N
8	Admin	Final29	adminfinal@example.com	0911223344	$2b$10$65JWjezpHudOJLGJlaw7bewqHDld823cwm3UpIuCV0XvWnMOOS04C	2025-07-28 11:02:09.45462+03	2025-07-28 11:02:09.45462+03	female	adminFinal	uploads\\profile_images\\0137c4630a980ad62de1f80eb6164150
67	tamrat abebe	tamrat abebe	abebetamrat21@gmail.com	0944357340	$2b$10$7SUPlnPXl1zDkaXsOOXnWeRUIcloawhm1RGLqcvH47FM/XriT.ncq	2025-09-07 16:33:04.787348+03	2025-09-07 16:33:04.787348+03	Male	\N	\N
\.


--
-- Data for Name: venue_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.venue_schedule (venue_id, venue, status, is_deleted, venue_am) FROM stdin;
12	new 	Active	t	am new
13	a13	Active	t	q35
6	main halls2	Active	f	 አዳራሽ
8	conference hall	Active	f	የስብሰባ አዳራሽ
9	confrenece hall	Active	f	የስብሰባ አዳራሽ
\.


--
-- Data for Name: visitor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visitor (user_id, nationality, acc_type, created, updated_at) FROM stdin;
47	Bangladesh	\N	\N	\N
48	Egypt	\N	\N	\N
61	Ethiopia	\N	\N	\N
63	Ethiopia	\N	\N	\N
67	Ethiopia	\N	\N	\N
3	Ethiopia	Guest	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03
4	Kenya	Regular	2025-07-23 15:22:40.333764+03	2025-07-23 15:22:40.333764+03
\.


--
-- Name: advertisements_ad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.advertisements_ad_id_seq', 8, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 7, true);


--
-- Name: department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_id_seq', 6, true);


--
-- Name: email_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_verifications_id_seq', 16, true);


--
-- Name: event_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_category_id_seq', 9, true);


--
-- Name: event_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_event_id_seq', 60, true);


--
-- Name: event_ticket_types_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_ticket_types_ticket_id_seq', 1, false);


--
-- Name: event_ticket_types_ticket_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_ticket_types_ticket_id_seq1', 138, true);


--
-- Name: feedback_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_responses_id_seq', 21, true);


--
-- Name: group_discounts_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_discounts_discount_id_seq', 8, true);


--
-- Name: image_galleries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_galleries_id_seq', 196, true);


--
-- Name: journey_timeline_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.journey_timeline_id_seq', 27, true);


--
-- Name: mission_vision_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mission_vision_values_id_seq', 50707, true);


--
-- Name: museum_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.museum_info_id_seq', 1002, true);


--
-- Name: page_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.page_content_id_seq', 634, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partners_id_seq', 36, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 10, true);


--
-- Name: pending_table_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pending_table_service_id_seq', 63, true);


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_permission_id_seq', 5, true);


--
-- Name: question_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_options_id_seq', 20, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 535, true);


--
-- Name: request_dates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_dates_id_seq', 247, true);


--
-- Name: request_timeslot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_timeslot_id_seq', 203, true);


--
-- Name: response_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.response_answers_id_seq', 105, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 51, true);


--
-- Name: service_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_category_id_seq', 5, true);


--
-- Name: service_facility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_facility_id_seq', 15, true);


--
-- Name: service_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_requests_id_seq', 133, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 1, false);


--
-- Name: social_media_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_media_links_id_seq', 680, true);


--
-- Name: survey_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_questions_id_seq', 10, true);


--
-- Name: surveys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.surveys_id_seq', 2, true);


--
-- Name: ticket_types_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_types_ticket_id_seq', 15, true);


--
-- Name: unavailable_dates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unavailable_dates_id_seq', 404, true);


--
-- Name: unavailable_time_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unavailable_time_slots_id_seq', 1464, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 67, true);


--
-- Name: venue_schedule_venue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venue_schedule_venue_id_seq', 13, true);


--
-- Name: advertisement advertisement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertisement
    ADD CONSTRAINT advertisement_pkey PRIMARY KEY (ad_id);


--
-- Name: advertisements advertisements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_pkey PRIMARY KEY (ad_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: booking_groups booking_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_groups
    ADD CONSTRAINT booking_groups_pkey PRIMARY KEY (group_id);


--
-- Name: bought_services bought_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_services
    ADD CONSTRAINT bought_services_pkey PRIMARY KEY (id);


--
-- Name: bought_ticket bought_ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_ticket
    ADD CONSTRAINT bought_ticket_pkey PRIMARY KEY (ticket_booking_id);


--
-- Name: bought_ticket_types bought_ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_ticket_types
    ADD CONSTRAINT bought_ticket_types_pkey PRIMARY KEY (type_id);


--
-- Name: contact_form contact_form_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_form
    ADD CONSTRAINT contact_form_pkey PRIMARY KEY (form_id);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (user_id);


--
-- Name: event_bought_tickets event_bought_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_bought_tickets
    ADD CONSTRAINT event_bought_tickets_pkey PRIMARY KEY (type_id);


--
-- Name: event_category event_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_category
    ADD CONSTRAINT event_category_pkey PRIMARY KEY (id);


--
-- Name: event_info event_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_info
    ADD CONSTRAINT event_info_pkey PRIMARY KEY (event_booking_id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (event_id);


--
-- Name: event_ticket_types event_ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_ticket_types
    ADD CONSTRAINT event_ticket_types_pkey PRIMARY KEY (ticket_id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: facility_facility_items facility_facility_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_facility_items
    ADD CONSTRAINT facility_facility_items_pkey PRIMARY KEY (id);


--
-- Name: facility_items facility_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facility_items
    ADD CONSTRAINT facility_items_pkey PRIMARY KEY (id);


--
-- Name: feedback_responses feedback_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_responses
    ADD CONSTRAINT feedback_responses_pkey PRIMARY KEY (id);


--
-- Name: group_discounts group_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_discounts
    ADD CONSTRAINT group_discounts_pkey PRIMARY KEY (discount_id);


--
-- Name: image_galleries image_galleries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_galleries
    ADD CONSTRAINT image_galleries_pkey PRIMARY KEY (id);


--
-- Name: journey_timeline journey_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_timeline
    ADD CONSTRAINT journey_timeline_pkey PRIMARY KEY (id);


--
-- Name: mission_vision_values mission_vision_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mission_vision_values
    ADD CONSTRAINT mission_vision_values_pkey PRIMARY KEY (id);


--
-- Name: museum_info museum_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.museum_info
    ADD CONSTRAINT museum_info_pkey PRIMARY KEY (id);


--
-- Name: museum_info museum_info_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.museum_info
    ADD CONSTRAINT museum_info_setting_key_key UNIQUE (setting_key);


--
-- Name: page_content page_content_page_name_section_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_page_name_section_name_key UNIQUE (page_name, section_name);


--
-- Name: page_content page_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_content
    ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: pending_payments_staff pending_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_payments_staff
    ADD CONSTRAINT pending_payments_pkey PRIMARY KEY (tx_ref);


--
-- Name: pending_payments pending_payments_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_payments
    ADD CONSTRAINT pending_payments_pkey1 PRIMARY KEY (tx_ref);


--
-- Name: pending_table_service pending_table_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_table_service
    ADD CONSTRAINT pending_table_service_pkey PRIMARY KEY (id);


--
-- Name: pending_table_service pending_table_service_tx_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_table_service
    ADD CONSTRAINT pending_table_service_tx_ref_key UNIQUE (tx_ref);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens2 refresh_tokens2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens2
    ADD CONSTRAINT refresh_tokens2_pkey PRIMARY KEY (jti);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: request_dates request_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_dates
    ADD CONSTRAINT request_dates_pkey PRIMARY KEY (id);


--
-- Name: request_timeslot request_timeslot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_timeslot
    ADD CONSTRAINT request_timeslot_pkey PRIMARY KEY (id);


--
-- Name: response_answers response_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT response_answers_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: service_category service_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_category
    ADD CONSTRAINT service_category_pkey PRIMARY KEY (id);


--
-- Name: service_facility service_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_facility
    ADD CONSTRAINT service_facility_pkey PRIMARY KEY (id);


--
-- Name: service_feedback service_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_feedback
    ADD CONSTRAINT service_feedback_pkey PRIMARY KEY (feedback_id);


--
-- Name: service_request service_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request
    ADD CONSTRAINT service_request_pkey PRIMARY KEY (request_id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: service_module services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_module
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- Name: services services_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey1 PRIMARY KEY (id);


--
-- Name: social_media_links social_media_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_media_links
    ADD CONSTRAINT social_media_links_pkey PRIMARY KEY (id);


--
-- Name: survey_questions survey_question_unique_ordinal; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_question_unique_ordinal UNIQUE (survey_id, ordinal);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: ticket_types ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_pkey PRIMARY KEY (ticket_id);


--
-- Name: unavailable_dates unavailable_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_dates
    ADD CONSTRAINT unavailable_dates_pkey PRIMARY KEY (id);


--
-- Name: unavailable_time_slots unavailable_time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_time_slots
    ADD CONSTRAINT unavailable_time_slots_pkey PRIMARY KEY (id);


--
-- Name: bought_ticket unique_chapa_tx_ref; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_ticket
    ADD CONSTRAINT unique_chapa_tx_ref UNIQUE (chapa_tx_ref);


--
-- Name: unavailable_dates unique_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_dates
    ADD CONSTRAINT unique_date UNIQUE (venue_id, date);


--
-- Name: social_media_links unique_platform; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_media_links
    ADD CONSTRAINT unique_platform UNIQUE (platform);


--
-- Name: unavailable_time_slots unique_slot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_time_slots
    ADD CONSTRAINT unique_slot UNIQUE (unavailable_date_id, start_time, end_time);


--
-- Name: request_timeslot unique_timeslot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_timeslot
    ADD CONSTRAINT unique_timeslot UNIQUE (request_date_id, start_time, end_time);


--
-- Name: question_options uq_question_option; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT uq_question_option UNIQUE (question_id, value);


--
-- Name: response_answers uq_response_question; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT uq_response_question UNIQUE (response_id, question_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: venue_schedule venue_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venue_schedule
    ADD CONSTRAINT venue_schedule_pkey PRIMARY KEY (venue_id);


--
-- Name: visitor visitor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor
    ADD CONSTRAINT visitor_pkey PRIMARY KEY (user_id);


--
-- Name: idx_image_galleries_page_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_galleries_page_section ON public.image_galleries USING btree (page_name, section_name);


--
-- Name: idx_journey_timeline_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_journey_timeline_date ON public.journey_timeline USING btree (date);


--
-- Name: idx_mission_vision_values_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mission_vision_values_type ON public.mission_vision_values USING btree (type);


--
-- Name: idx_museum_info_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_museum_info_key ON public.museum_info USING btree (setting_key);


--
-- Name: idx_page_content_page_section; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_page_content_page_section ON public.page_content USING btree (page_name, section_name);


--
-- Name: idx_refresh_tokens2_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens2_user ON public.refresh_tokens2 USING btree (user_id);


--
-- Name: idx_social_media_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_social_media_platform ON public.social_media_links USING btree (platform);


--
-- Name: service_requests set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: bought_services bought_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_services
    ADD CONSTRAINT bought_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bought_services bought_services_ticket_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_services
    ADD CONSTRAINT bought_services_ticket_booking_id_fkey FOREIGN KEY (ticket_booking_id) REFERENCES public.bought_ticket(ticket_booking_id);


--
-- Name: employee employee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: event_bought_tickets event_bought_tickets_event_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_bought_tickets
    ADD CONSTRAINT event_bought_tickets_event_booking_id_fkey FOREIGN KEY (event_booking_id) REFERENCES public.event_info(event_booking_id);


--
-- Name: event_bought_tickets event_bought_tickets_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_bought_tickets
    ADD CONSTRAINT event_bought_tickets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.event_ticket_types(ticket_id) ON DELETE CASCADE;


--
-- Name: event_ticket_types event_ticket_types_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_ticket_types
    ADD CONSTRAINT event_ticket_types_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id) ON DELETE CASCADE;


--
-- Name: feedback_responses feedback_responses_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_responses
    ADD CONSTRAINT feedback_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE RESTRICT;


--
-- Name: bought_ticket fk_bought_ticket_group; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_ticket
    ADD CONSTRAINT fk_bought_ticket_group FOREIGN KEY (group_id) REFERENCES public.booking_groups(group_id);


--
-- Name: service_facility fk_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_facility
    ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.service_category(id) ON DELETE CASCADE;


--
-- Name: event fk_event_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT fk_event_category FOREIGN KEY (category_id) REFERENCES public.event_category(id);


--
-- Name: bought_ticket_types fk_ticket_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bought_ticket_types
    ADD CONSTRAINT fk_ticket_id FOREIGN KEY (ticket_id) REFERENCES public.ticket_types(ticket_id);


--
-- Name: service_facility fk_venue; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_facility
    ADD CONSTRAINT fk_venue FOREIGN KEY (venue_id) REFERENCES public.venue_schedule(venue_id) ON DELETE CASCADE;


--
-- Name: event fk_venue_schedule; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT fk_venue_schedule FOREIGN KEY (venue_id) REFERENCES public.venue_schedule(venue_id);


--
-- Name: visitor fk_visitor_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor
    ADD CONSTRAINT fk_visitor_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: group_discounts group_discounts_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_discounts
    ADD CONSTRAINT group_discounts_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket_types(ticket_id);


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: pending_table_service pending_table_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_table_service
    ADD CONSTRAINT pending_table_service_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;


--
-- Name: question_options question_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens2 refresh_tokens2_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens2
    ADD CONSTRAINT refresh_tokens2_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: request_dates request_dates_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_dates
    ADD CONSTRAINT request_dates_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;


--
-- Name: request_timeslot request_timeslot_request_date_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_timeslot
    ADD CONSTRAINT request_timeslot_request_date_id_fkey FOREIGN KEY (request_date_id) REFERENCES public.request_dates(id) ON DELETE CASCADE;


--
-- Name: response_answers response_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT response_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON DELETE CASCADE;


--
-- Name: response_answers response_answers_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.response_answers
    ADD CONSTRAINT response_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.feedback_responses(id) ON DELETE CASCADE;


--
-- Name: survey_questions survey_questions_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: unavailable_dates unavailable_dates_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_dates
    ADD CONSTRAINT unavailable_dates_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venue_schedule(venue_id) ON DELETE CASCADE;


--
-- Name: unavailable_time_slots unavailable_time_slots_unavailable_date_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unavailable_time_slots
    ADD CONSTRAINT unavailable_time_slots_unavailable_date_id_fkey FOREIGN KEY (unavailable_date_id) REFERENCES public.unavailable_dates(id) ON DELETE CASCADE;


--
-- Name: visitor visitor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitor
    ADD CONSTRAINT visitor_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

