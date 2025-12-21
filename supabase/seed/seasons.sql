-- Seed Megabike podium history (from frontend fallback data)

insert into public.seasons (season_year, winner, second, third) values
  (2004, 'Maximilien', 'Fabrice', 'Jean-Christophe'),
  (2005, 'Patrice', 'Fabrice', 'Dominique'),
  (2006, 'Maximilien', 'Dominique', 'Fabrice'),
  (2007, 'Jean-Christophe', 'Damien', 'Harold'),
  (2008, 'Maximilien', 'Jean-Christophe', 'Pierre-Jean'),
  (2009, 'Harold', 'Damien', 'Dominique'),
  (2010, 'Maximilien', 'Damien', 'Dominique'),
  (2011, 'Maximilien', 'Patrice', 'Harold'),
  (2012, 'Damien', 'Harold', 'Dominique'),
  (2013, 'Harold', 'Dominique', 'Jean-Christophe'),
  (2014, 'Damien', 'Patrice', 'Maximilien'),
  (2015, 'Harold', 'Maximilien', 'Antoine'),
  (2016, 'Damien', 'Antoine', 'Dominique'),
  (2017, 'Damien', 'Harold', 'Antoine'),
  (2018, 'Antoine', 'Pierre-Gilles', 'Jean-Christophe'),
  (2019, 'Antoine', 'Harold', 'Jean-Christophe'),
  (2020, 'Bernard', 'Jean-Christophe', 'Brice'),
  (2021, 'Olivier (Jo)', 'Antoine', 'Albert'),
  (2022, 'Felix', 'Jack', 'Albert'),
  (2023, 'Adrien', 'Jack', 'Dominique'),
  (2024, 'Albert', 'Jack', 'Dominique')
on conflict (season_year) do update set
  winner = excluded.winner,
  second = excluded.second,
  third = excluded.third;


