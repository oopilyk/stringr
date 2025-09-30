drop extension if exists "pg_net";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."messages" from "authenticated";

revoke insert on table "public"."messages" from "authenticated";

revoke references on table "public"."messages" from "authenticated";

revoke select on table "public"."messages" from "authenticated";

revoke trigger on table "public"."messages" from "authenticated";

revoke truncate on table "public"."messages" from "authenticated";

revoke update on table "public"."messages" from "authenticated";

revoke delete on table "public"."messages" from "service_role";

revoke insert on table "public"."messages" from "service_role";

revoke references on table "public"."messages" from "service_role";

revoke select on table "public"."messages" from "service_role";

revoke trigger on table "public"."messages" from "service_role";

revoke truncate on table "public"."messages" from "service_role";

revoke update on table "public"."messages" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."requests" from "anon";

revoke insert on table "public"."requests" from "anon";

revoke references on table "public"."requests" from "anon";

revoke select on table "public"."requests" from "anon";

revoke trigger on table "public"."requests" from "anon";

revoke truncate on table "public"."requests" from "anon";

revoke update on table "public"."requests" from "anon";

revoke delete on table "public"."requests" from "authenticated";

revoke insert on table "public"."requests" from "authenticated";

revoke references on table "public"."requests" from "authenticated";

revoke select on table "public"."requests" from "authenticated";

revoke trigger on table "public"."requests" from "authenticated";

revoke truncate on table "public"."requests" from "authenticated";

revoke update on table "public"."requests" from "authenticated";

revoke delete on table "public"."requests" from "service_role";

revoke insert on table "public"."requests" from "service_role";

revoke references on table "public"."requests" from "service_role";

revoke select on table "public"."requests" from "service_role";

revoke trigger on table "public"."requests" from "service_role";

revoke truncate on table "public"."requests" from "service_role";

revoke update on table "public"."requests" from "service_role";

revoke delete on table "public"."reviews" from "anon";

revoke insert on table "public"."reviews" from "anon";

revoke references on table "public"."reviews" from "anon";

revoke select on table "public"."reviews" from "anon";

revoke trigger on table "public"."reviews" from "anon";

revoke truncate on table "public"."reviews" from "anon";

revoke update on table "public"."reviews" from "anon";

revoke delete on table "public"."reviews" from "authenticated";

revoke insert on table "public"."reviews" from "authenticated";

revoke references on table "public"."reviews" from "authenticated";

revoke select on table "public"."reviews" from "authenticated";

revoke trigger on table "public"."reviews" from "authenticated";

revoke truncate on table "public"."reviews" from "authenticated";

revoke update on table "public"."reviews" from "authenticated";

revoke delete on table "public"."reviews" from "service_role";

revoke insert on table "public"."reviews" from "service_role";

revoke references on table "public"."reviews" from "service_role";

revoke select on table "public"."reviews" from "service_role";

revoke trigger on table "public"."reviews" from "service_role";

revoke truncate on table "public"."reviews" from "service_role";

revoke update on table "public"."reviews" from "service_role";

revoke delete on table "public"."stringer_settings" from "anon";

revoke insert on table "public"."stringer_settings" from "anon";

revoke references on table "public"."stringer_settings" from "anon";

revoke select on table "public"."stringer_settings" from "anon";

revoke trigger on table "public"."stringer_settings" from "anon";

revoke truncate on table "public"."stringer_settings" from "anon";

revoke update on table "public"."stringer_settings" from "anon";

revoke delete on table "public"."stringer_settings" from "authenticated";

revoke insert on table "public"."stringer_settings" from "authenticated";

revoke references on table "public"."stringer_settings" from "authenticated";

revoke select on table "public"."stringer_settings" from "authenticated";

revoke trigger on table "public"."stringer_settings" from "authenticated";

revoke truncate on table "public"."stringer_settings" from "authenticated";

revoke update on table "public"."stringer_settings" from "authenticated";

revoke delete on table "public"."stringer_settings" from "service_role";

revoke insert on table "public"."stringer_settings" from "service_role";

revoke references on table "public"."stringer_settings" from "service_role";

revoke select on table "public"."stringer_settings" from "service_role";

revoke trigger on table "public"."stringer_settings" from "service_role";

revoke truncate on table "public"."stringer_settings" from "service_role";

revoke update on table "public"."stringer_settings" from "service_role";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
 RETURNS double precision
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
declare
  earth_radius constant double precision := 6371; -- km
  dlat double precision;
  dlng double precision;
  a double precision;
  c double precision;
begin
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  return earth_radius * c;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;


