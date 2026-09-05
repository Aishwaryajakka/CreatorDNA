-- Allow user-declared Creator Foundation facts to live beside extracted DNA.
alter table public.dna_nodes drop constraint if exists dna_nodes_type_check;
alter table public.dna_nodes add constraint dna_nodes_type_check check (type in ('story','belief','theme','experience','lesson','value','goal','identity','expertise'));
