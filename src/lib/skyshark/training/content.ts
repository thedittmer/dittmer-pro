import type { StudySection } from './types';

/**
 * Static fallback content for the Training guide. Source of truth until a
 * PocketBase `study_sections` collection is populated; `loadSections()` prefers
 * PocketBase and falls back to this so the guide always works offline.
 *
 * AIRSPACE is fully built and chunked into 6 short lessons covering FAA ACS
 * Area II (UA.II.A airspace classification + UA.II.B operational requirements).
 * Content cross-checked against the FAA Remote Pilot Study Guide and the FAA
 * official UAG sample question bank. ACS codes are noted per lesson.
 *
 * The other four sections are listed but marked `ready: false` ("coming soon").
 */
export const studySections: StudySection[] = [
	{
		id: 'airspace',
		order: 1,
		domain: 'airspace',
		title: 'Airspace',
		slug: 'airspace',
		summary:
			'Classes, special-use & other airspace, ATC, and the operating rules — covers FAA ACS Area II.',
		scene: 'airspace',
		ready: true,
		lessons: [
			{
				// UA.II.A.K1 (Class G, Class E)
				id: 'uncontrolled',
				title: 'Controlled vs. uncontrolled',
				check: {
					q: 'Does Class G require ATC authorization?',
					a: 'No — Class G is uncontrolled, so no authorization is needed. (Every other Part 107 rule still applies.)'
				},
				lines: [
					{
						text: "Welcome to airspace — the biggest topic on the Part 107 exam. Let's build it from the ground up.",
						focus: null
					},
					{
						text: 'Two questions decide everything: is the airspace controlled or uncontrolled, and do you, the remote pilot, need air traffic control authorization before you fly there.',
						focus: null
					},
					{
						text: 'Start at the bottom. Class G is uncontrolled airspace. It runs from the surface up to the base of the overlying Class E above it.',
						focus: 'G'
					},
					{
						text: 'In Class G you do not need ATC authorization — but uncontrolled is not unregulated. Stay at or below four hundred feet, keep the aircraft in sight, and yield to crewed aircraft.',
						focus: 'G'
					},
					{
						text: "Above Class G sits Class E — controlled airspace that isn't A, B, C, or D. Most of the country has Class E above it.",
						focus: 'E'
					},
					{
						text: 'Class E usually begins at twelve hundred feet above the ground. Near airports it can start at seven hundred feet, shown by a faded magenta ring, or at the surface, shown by a dashed magenta line.',
						focus: 'E'
					},
					{
						text: 'The drone takeaway: you only need authorization in Class E when it begins at the surface around an airport. The shelves up at seven hundred or twelve hundred feet are usually above where you fly.',
						focus: 'E'
					}
				]
			},
			{
				// UA.II.A.K1 (Class B, C, D) + UA.II.B.K2 (authorization)
				id: 'towered',
				title: 'Towered: B, C, D',
				check: {
					q: 'Which airspace classes require ATC authorization?',
					a: 'Class B, C, D, and surface Class E all require authorization. Class G never does.'
				},
				lines: [
					{
						text: 'Now the towered airports. Class B surrounds the very busiest ones — major cities — from the surface up to around ten thousand feet.',
						focus: 'B'
					},
					{
						text: 'Class B is shaped like an upside-down wedding cake: tight at the surface, stepping wider as it climbs to capture airliners. On a sectional it is outlined with solid blue lines.',
						focus: 'B'
					},
					{
						text: 'You must have ATC authorization before operating anywhere in Class B — most of the time you get it instantly through LAANC.',
						focus: 'B'
					},
					{
						text: 'Class C surrounds busy airports with a control tower and radar service, generally from the surface to four thousand feet above the field.',
						focus: 'C'
					},
					{
						text: 'A typical Class C has a five nautical mile inner core and a ten nautical mile outer shelf, drawn with solid magenta lines. Authorization required.',
						focus: 'C'
					},
					{
						text: 'Class D surrounds smaller towered airports, generally surface to twenty-five hundred feet above the field, drawn with a dashed blue line. Authorization required here too.',
						focus: 'D'
					},
					{
						text: 'And the one you will never touch: Class A, from eighteen thousand feet up to flight level six hundred — high-altitude instrument traffic only.',
						focus: null
					},
					{
						text: 'To get permission, use LAANC — the Low Altitude Authorization and Notification Capability — for near-instant approval, or the FAA DroneZone for special requests.',
						focus: null
					}
				]
			},
			{
				// UA.II.A.K2
				id: 'special-use',
				title: 'Special-use airspace',
				check: {
					q: "You see a 'P' area on the chart. Can you fly there?",
					a: 'No — P means Prohibited. Flight is banned entirely.'
				},
				lines: [
					{
						text: 'Beyond the classes are special-use airspace areas — places with activity you must account for. There are six kinds.',
						focus: null
					},
					{
						text: 'Prohibited areas, marked with a P, ban flight entirely — like the airspace over the White House and Camp David.',
						focus: null
					},
					{
						text: 'Restricted areas, marked R, hold hazards like artillery fire or guided missiles. You may only fly there when the area is cold, or with permission from the controlling agency.',
						focus: null
					},
					{
						text: 'Warning areas, marked W, begin three nautical miles off the coast over international waters and contain similar hazards.',
						focus: null
					},
					{
						text: 'Military Operations Areas, or MOAs, separate military training from other traffic. They are named rather than numbered — like "Camden Ridge MOA".',
						focus: null
					},
					{
						text: 'Alert areas, marked A, warn of heavy pilot training or unusual activity. Controlled firing areas contain activity that stops the moment an aircraft approaches, so they are not even charted.',
						focus: null
					}
				]
			},
			{
				// UA.II.A.K3 + UA.II.A.K4
				id: 'other-atc',
				title: 'Other airspace & ATC',
				check: {
					q: 'A 4-digit MTR like VR1667 operates at what altitude?',
					a: 'At or below 1,500 feet AGL — right where you fly. (A 3-digit MTR includes segments above 1,500 AGL.)'
				},
				lines: [
					{
						text: 'There is also "other airspace." Military Training Routes, labeled I-R or V-R, are low-altitude, high-speed military corridors. A four-digit number — like V-R one-six-six-seven — means that route stays at or below fifteen hundred feet, right where you fly.',
						focus: null
					},
					{
						text: 'Temporary Flight Restrictions, or TFRs, appear around wildfires, disasters, major sporting events, and VIP movement. They change daily — always check before you fly.',
						focus: null
					},
					{
						text: 'Rounding out the list: Terminal Radar Service Areas where extra radar service is offered; National Security Areas you are asked to voluntarily avoid; parachute jump areas; published VFR routes; and Airport Advisory Services.',
						focus: null
					},
					{
						text: 'Holding it all together is Air Traffic Control and the National Airspace System, whose job is to keep aircraft separated and traffic moving safely.',
						focus: null
					}
				]
			},
			{
				// UA.II.B.K1, K2, K3, K5
				id: 'operating-rules',
				title: 'Operating rules',
				check: {
					q: 'Minimum visibility and cloud clearance under Part 107?',
					a: '3 statute miles of visibility; stay 500 ft below clouds and 2,000 ft from them horizontally.'
				},
				lines: [
					{
						text: 'Now the operating rules. Weather minimums: at least three statute miles of visibility from your control station, and stay five hundred feet below clouds and two thousand feet from them horizontally.',
						focus: null
					},
					{
						text: 'In controlled airspace you need authorization, and you must respect any altitude ceiling LAANC gives you. Near any airport — towered or not — yield to crewed aircraft and never interfere with the traffic pattern.',
						focus: null
					},
					{
						text: 'Check NOTAMs — Notices to Air Missions — through Flight Service before every flight. That is how TFRs and other short-notice changes are published.',
						focus: null
					}
				]
			},
			{
				// UA.II.B.K4 (a–g) + UA.II.B.K6–K10
				id: 'hazards-night',
				title: 'Hazards & night',
				check: {
					q: "At night, what do an aircraft's red and green lights tell you?",
					a: 'Red marks its left wing, green its right — so you can tell which way it is heading.'
				},
				lines: [
					{
						text: 'Know the flight hazards. Do not fly beneath unmanned free balloons, and stay clear of any aircraft making an emergency airborne inspection.',
						focus: null
					},
					{
						text: 'Avoid the wire environment — power and guy wires are nearly invisible — and steer clear of thermal plumes rising from smoke stacks and cooling towers.',
						focus: null
					},
					{
						text: 'Be aware of precipitation static in moisture, and never shine a laser at an aircraft; if a crewed aircraft is illuminated by a laser, report it.',
						focus: null
					},
					{
						text: 'Night flying is allowed once you complete the updated recurrent training and your drone carries anti-collision lighting visible for three statute miles.',
						focus: null
					},
					{
						text: 'Learn aircraft lights: red on the left wing, green on the right, white at the tail — that is how you tell which way one is heading in the dark. Mark tall or unlit ground obstacles too.',
						focus: null
					}
				]
			}
		]
	},
	{
		id: 'weather',
		order: 2,
		domain: 'weather',
		title: 'Weather',
		slug: 'weather',
		summary: 'Sources, reading a METAR, density altitude, stability, and hazards — FAA ACS Area III.',
		scene: 'weather',
		ready: true,
		lessons: [
			{
				// UA.III.A.K1, K3, K4, K5
				id: 'sources',
				title: 'Sources & briefings',
				check: {
					q: 'What is the difference between a METAR and a TAF?',
					a: 'A METAR is an observation of current weather; a TAF is a forecast for an airport’s area.'
				},
				lines: [
					{
						text: 'Before every flight, get a weather briefing. Pilots use Flight Service at 1-800-WX-BRIEF, or go online to aviationweather.gov for the full picture.',
						focus: null
					},
					{
						text: 'Two reports you must read. A METAR is an observation of the weather happening right now. A TAF is a forecast for an airport’s area.',
						focus: null
					},
					{
						text: 'Those observations come from automated stations — ASOS and AWOS — that measure conditions continuously and broadcast them by radio and online.',
						focus: null
					},
					{
						text: 'Weather charts and the briefing together show fronts, winds, and hazards along your route. Always check before you launch.',
						focus: null
					}
				]
			},
			{
				// UA.III.A.K2
				id: 'metar',
				title: 'Reading a METAR',
				check: {
					q: 'In a METAR, what does the wind group "21015G25KT" mean?',
					a: 'Wind from 210° true at 15 knots, gusting to 25 knots.'
				},
				lines: [
					{
						text: "Let's decode a METAR. It opens with the station identifier and the time, given in Zulu — coordinated universal time.",
						focus: null
					},
					{
						text: 'Next comes wind. Two-one-zero, one-five, gust two-five knots means wind from two hundred ten degrees true at fifteen knots, gusting to twenty-five.',
						focus: 'wind'
					},
					{
						text: 'Then visibility in statute miles, and sky cover: few, scattered, broken, or overcast. The lowest broken or overcast layer is the ceiling.',
						focus: null
					},
					{
						text: 'Then temperature and dewpoint in Celsius. When those two numbers are close together, the air is near saturation — expect fog and low visibility.',
						focus: 'fog'
					},
					{
						text: 'Last is the altimeter setting. Put it together and you can read the current conditions at a glance.',
						focus: null
					}
				]
			},
			{
				// UA.III.B.K1a (density altitude), UA.III.B.K1b (wind)
				id: 'density-wind',
				title: 'Density altitude & wind',
				check: {
					q: 'How does high density altitude affect your drone?',
					a: 'Thinner air means less lift and thrust — propeller efficiency decreases and climb suffers.'
				},
				lines: [
					{
						text: 'Now how weather affects performance. Density altitude is the big one: hot, high, and humid conditions make the air thin.',
						focus: null
					},
					{
						text: 'In thin air the propellers bite less — lift and thrust drop, climb suffers, and you can carry less. Plan for it on hot days at elevation.',
						focus: null
					},
					{
						text: 'Wind matters too. Gusts and wind shear near buildings and terrain can shove a small drone around — give yourself margin.',
						focus: 'wind'
					}
				]
			},
			{
				// UA.III.B.K1c (stability), UA.III.B.K1d (air masses & fronts)
				id: 'stability',
				title: 'Stable vs. unstable',
				check: {
					q: 'Stable air gives you what kind of clouds and visibility?',
					a: 'Stratiform (flat) clouds, steady precipitation, and poor visibility — and the air is smooth.'
				},
				lines: [
					{
						text: 'Air is either stable or unstable, and you can read which from the sky itself.',
						focus: null
					},
					{
						text: 'Stable air resists rising. It makes flat, layered stratus clouds, steady precipitation, smooth air — and often poor visibility from trapped haze.',
						focus: 'stable'
					},
					{
						text: 'Unstable air rises freely. It builds puffy, towering cumulus clouds, showery precipitation, good visibility — and turbulence.',
						focus: 'unstable'
					},
					{
						text: 'A low-level temperature inversion traps moisture near the ground: smooth air, but poor visibility, fog, and haze.',
						focus: 'fog'
					},
					{
						text: 'Fronts are boundaries between air masses; as one passes, the wind shifts and clouds and precipitation change.',
						focus: null
					}
				]
			},
			{
				// UA.III.B.K1e–k (thunderstorms, microbursts, tornadoes, icing, hail, fog, lightning, ceiling/vis)
				id: 'hazards',
				title: 'Weather hazards',
				check: {
					q: 'Temperature and dewpoint are close together — what is likely?',
					a: 'The air is near saturation — fog, mist, and low visibility are likely.'
				},
				lines: [
					{
						text: 'Finally, the hazards. Thunderstorms are the worst: violent updrafts and downbursts — microbursts — that can slam an aircraft toward the ground. Stay well clear.',
						focus: 'storm'
					},
					{
						text: 'Storms also bring tornadoes, large hail, and lightning — none of which you want anywhere near your aircraft.',
						focus: 'storm'
					},
					{
						text: 'Icing robs lift and adds weight; even small drones can ice up in visible moisture near freezing. Land if you see it forming.',
						focus: null
					},
					{
						text: 'Fog and low ceilings drop visibility below the three-mile minimum fast — watch for a tight temperature-dewpoint spread.',
						focus: 'fog'
					},
					{
						text: "When in doubt, don't launch. Weather is the easiest hazard to simply wait out.",
						focus: null
					}
				]
			}
		]
	},
	{
		id: 'regulations',
		order: 3,
		domain: 'regulations',
		title: 'Regulations',
		slug: 'regulations',
		summary: 'Certificate, registration & Remote ID, the limits, and the rules — FAA ACS Area I.',
		scene: 'regulations',
		ready: true,
		lessons: [
			{
				// UA.I.C (certification), UA.I.B.K22
				id: 'certificate',
				title: 'Your certificate',
				check: {
					q: 'How do you keep your remote pilot certificate current?',
					a: 'Complete the free online recurrent training every 24 calendar months.'
				},
				lines: [
					{
						text: 'First, you. To fly under Part 107 you need a Remote Pilot Certificate. You must be at least sixteen, able to read and understand English, and in a condition — physical and mental — to fly safely.',
						focus: null
					},
					{
						text: 'You earn it by passing the aeronautical knowledge test, after TSA security vetting.',
						focus: null
					},
					{
						text: 'It does not expire, but you stay current by completing free online recurrent training every twenty-four calendar months.',
						focus: null
					},
					{
						text: 'And remember the golden rule: the remote pilot in command is the final authority for the flight, and is directly responsible for it.',
						focus: null
					}
				]
			},
			{
				// UA.I.B.K1 (registration), UA.I.F (Remote ID)
				id: 'register-rid',
				title: 'Register & Remote ID',
				check: {
					q: 'What weight requires FAA registration?',
					a: 'More than 0.55 pounds — register it (Part 48) and mark the number on the exterior.'
				},
				lines: [
					{
						text: 'Your aircraft needs paperwork too. Any drone over half a pound — point five five pounds — must be registered with the FAA, and the registration number marked on the outside.',
						focus: null
					},
					{
						text: "Most aircraft also need Remote ID — a digital license plate that broadcasts the drone's identity and location.",
						focus: null
					},
					{
						text: 'You meet it three ways: built-in Standard Remote ID, a broadcast module added on, or by flying only at an FAA-recognized identification area, a FRIA.',
						focus: null
					},
					{
						text: 'If your Standard Remote ID fails during flight, land as soon as practicable.',
						focus: null
					}
				]
			},
			{
				// UA.I.B.K21 a–d, K9, K10, K24, K25
				id: 'limits',
				title: 'The operating limits',
				check: {
					q: 'Maximum altitude and groundspeed under Part 107?',
					a: '400 feet AGL and 100 mph (87 knots).'
				},
				lines: [
					{
						text: 'Now the numbers the test loves. Maximum altitude: four hundred feet above the ground — or within four hundred feet of a structure.',
						focus: 'altitude'
					},
					{
						text: 'Maximum groundspeed: one hundred miles per hour — that is eighty-seven knots.',
						focus: 'speed'
					},
					{
						text: 'Minimum visibility: three statute miles from your control station, and stay five hundred feet below and two thousand feet horizontally from clouds.',
						focus: null
					},
					{
						text: 'Keep the aircraft within visual line of sight at all times — you, or a visual observer, must see it with your own eyes.',
						focus: 'vlos'
					},
					{
						text: 'Fly in daylight, or in civil twilight and at night if the drone has anti-collision lighting visible for three statute miles.',
						focus: 'night'
					}
				]
			},
			{
				// UA.I.B.K2, K4, K4a, K20, K5
				id: 'responsibilities',
				title: 'Pilot responsibilities',
				check: {
					q: 'May you deviate from a rule in an in-flight emergency?',
					a: 'Yes — deviate as needed to meet the emergency, then report it to the FAA upon request.'
				},
				lines: [
					{
						text: 'Before every flight the remote PIC must inspect the aircraft, confirm it is in a condition for safe operation, and become familiar with the area and the weather.',
						focus: null
					},
					{
						text: 'Someone else may manipulate the controls — but only under your direct supervision, and only if you can immediately take over.',
						focus: null
					},
					{
						text: 'In an in-flight emergency you may deviate from any rule as far as needed to handle it — and you must report that deviation to the FAA upon request.',
						focus: null
					}
				]
			},
			{
				// UA.I.B.K6, K7, K8, K12, K13, K14
				id: 'safe-legal',
				title: 'Stay safe & legal',
				check: {
					q: 'Whom must you yield right-of-way to?',
					a: 'All crewed aircraft — always give way, and see and avoid.'
				},
				lines: [
					{
						text: 'A handful of hard rules. Never operate carelessly or recklessly, and never drop an object in a way that creates a hazard.',
						focus: null
					},
					{
						text: 'No flying from a moving vehicle unless you are over a sparsely populated area. No carrying hazardous material.',
						focus: null
					},
					{
						text: 'No alcohol within eight hours, none while impaired, and never at or above a point-zero-four blood alcohol level.',
						focus: null
					},
					{
						text: 'One remote pilot may operate only one aircraft at a time. And always yield the right of way to crewed aircraft — see and avoid.',
						focus: null
					}
				]
			},
			{
				// UA.I.B.K15–K19, Area E (ops over people), accident reporting, UA.I.D (waivers)
				id: 'where-people',
				title: 'Where you can fly & people',
				check: {
					q: 'When must you report an accident to the FAA?',
					a: 'Within 10 days, if it causes serious injury, loss of consciousness, or property damage over $500.'
				},
				lines: [
					{
						text: 'Where you fly is regulated too. You need authorization in controlled airspace, you must not interfere near airports, and you must avoid prohibited and restricted areas — check NOTAMs first.',
						focus: null
					},
					{
						text: 'Flying over people is allowed only by category — Categories one through four — based on how safe your drone is for the people below.',
						focus: null
					},
					{
						text: 'If an operation causes serious injury, loss of consciousness, or property damage over five hundred dollars, report it to the FAA within ten days.',
						focus: null
					},
					{
						text: 'And many of these rules can be waived — the FAA can grant a Certificate of Waiver if you show you can fly safely without them.',
						focus: null
					}
				]
			}
		]
	},
	{
		id: 'sectional',
		order: 4,
		domain: 'sectional',
		title: 'Sectional Charts',
		slug: 'sectional',
		summary: 'Airports, airspace colors, special use, and terrain — how to read a sectional.',
		scene: 'sectional',
		ready: true,
		lessons: [
			{
				id: 'reading',
				title: 'Reading a sectional',
				check: {
					q: 'Where do you find the most comprehensive airport information?',
					a: 'The Chart Supplement (formerly the Airport/Facility Directory).'
				},
				lines: [
					{
						text: 'A sectional chart is your map of the sky. It shows airports, airspace, terrain, and obstacles for a region — always use the current edition.',
						focus: null
					},
					{
						text: 'Latitude and longitude form a grid: latitude runs north and south of the equator, longitude east and west of Greenwich. Use them to pin down any spot.',
						focus: null
					},
					{
						text: 'Every symbol is defined in the FAA Aeronautical Chart Users Guide — the key to the whole chart.',
						focus: null
					},
					{
						text: 'For the deepest airport detail — frequencies, runways, services — the Chart Supplement, once called the Airport/Facility Directory, is the most comprehensive source.',
						focus: null
					}
				]
			},
			{
				id: 'airports',
				title: 'Airports',
				check: {
					q: 'A magenta airport symbol means what?',
					a: 'An airport without an operating control tower. Blue means it has an operating control tower.'
				},
				lines: [
					{
						text: 'Airports come in two colors. A magenta airport symbol means there is no operating control tower.',
						focus: 'airport'
					},
					{
						text: 'A blue airport symbol means the airport has an operating control tower.',
						focus: 'airport'
					},
					{
						text: 'Ticks around the symbol show fuel and services are available; the data block lists the name, elevation, and frequencies like the CTAF.',
						focus: 'airport'
					}
				]
			},
			{
				id: 'airspace-colors',
				title: 'Airspace colors',
				check: {
					q: 'What lines mark Class C versus Class B?',
					a: 'Class C is solid magenta lines; Class B is solid blue lines.'
				},
				lines: [
					{
						text: 'Now the airspace. Class B is outlined with solid blue lines — the wedding-cake over the biggest airports.',
						focus: 'classB'
					},
					{
						text: 'Class C is outlined with solid magenta lines, with its core and its shelf.',
						focus: 'classC'
					},
					{
						text: 'Class D is a dashed blue line around a smaller towered airport.',
						focus: 'classD'
					},
					{
						text: 'Class E to the surface is a dashed magenta line; Class E starting at seven hundred feet is a faded magenta band.',
						focus: null
					}
				]
			},
			{
				id: 'special-routes',
				title: 'Special use & routes',
				check: {
					q: 'How are Military Training Routes shown, and what does a 4-digit number mean?',
					a: 'Gray lines labeled IR/VR; a 4-digit number means the route is at or below 1,500 ft AGL.'
				},
				lines: [
					{
						text: 'Special-use airspace — prohibited, restricted, MOAs, alert and warning areas — is drawn with hatched blue or magenta boundaries; the chart panel lists their altitudes and hours.',
						focus: null
					},
					{
						text: 'Military Training Routes appear as gray lines labeled I-R or V-R; remember, a four-digit number means the route stays at or below fifteen hundred feet.',
						focus: null
					},
					{
						text: 'Victor airways are the faint blue corridors that live within Class E.',
						focus: null
					}
				]
			},
			{
				id: 'terrain',
				title: 'Terrain & obstacles',
				check: {
					q: "What do the large quadrant numbers (like '27') on a sectional mean?",
					a: 'The Maximum Elevation Figure — the highest terrain or obstacle in that quadrant, in hundreds of feet MSL.'
				},
				lines: [
					{
						text: 'The chart keeps you clear of the ground too. The big number in each grid square is the Maximum Elevation Figure — the highest terrain or obstacle in that quadrant, in hundreds of feet above sea level.',
						focus: 'mef'
					},
					{
						text: 'So a value of two-seven means twenty-seven hundred feet MSL.',
						focus: 'mef'
					},
					{
						text: 'Obstacles like towers show their height two ways: bold is feet above sea level, and the number in parentheses is feet above the ground.',
						focus: null
					}
				]
			},
			{
				id: 'plan',
				title: 'Plan your flight',
				check: {
					q: 'Before flying a new spot, what three things should the chart tell you?',
					a: 'What airspace you’re in (and whether you need authorization), nearby airports, and terrain/obstacle heights.'
				},
				lines: [
					{
						text: 'Put it together. Find your location by latitude and longitude, then read the airspace around it — and whether you need authorization.',
						focus: null
					},
					{
						text: 'Check for nearby airports and their towers, any special-use areas, and the tallest obstacles from the elevation figures.',
						focus: null
					},
					{
						text: 'A sectional read well turns an unfamiliar spot into a flight you can plan with confidence.',
						focus: null
					}
				]
			}
		]
	},
	{
		id: 'loading-performance',
		order: 5,
		domain: 'loading-performance',
		title: 'Loading & Performance',
		slug: 'loading-performance',
		summary: 'Weight, center of gravity, load factor, and performance — FAA ACS Area IV.',
		scene: 'loading',
		ready: true,
		lessons: [
			{
				// UA.IV.A.K1a, UA.IV.A.K2
				id: 'weight',
				title: 'Weight & loading',
				check: {
					q: 'Where do you find your aircraft’s loading limits?',
					a: 'The Pilot’s Operating Handbook or UAS Flight Manual.'
				},
				lines: [
					{
						text: 'Every aircraft has a maximum gross takeoff weight. Stay under it.',
						focus: 'weight'
					},
					{
						text: 'Adding payload eats into performance: slower climb, shorter flight time, and less responsive control.',
						focus: 'weight'
					},
					{
						text: 'Exceeding the maximum weight is unsafe — it lengthens takeoff, kills your climb, and can overstress the aircraft.',
						focus: 'weight'
					},
					{
						text: 'Find the limits, and how to load it, in the Pilot’s Operating Handbook or the UAS Flight Manual.',
						focus: null
					}
				]
			},
			{
				// UA.IV.A.K1b
				id: 'cg',
				title: 'Center of gravity',
				check: {
					q: 'What happens if the center of gravity is too far aft?',
					a: 'The aircraft becomes less stable and harder to control.'
				},
				lines: [
					{
						text: 'Balance matters as much as weight. The center of gravity — the CG — is the point the aircraft balances around, and it must stay within limits.',
						focus: 'cg'
					},
					{
						text: 'Load it evenly. A payload mounted off-center shifts the CG and makes the aircraft want to tip that way.',
						focus: 'cg'
					},
					{
						text: 'A CG too far aft makes the aircraft less stable and harder to control; too far forward makes it sluggish. Keep it in the green.',
						focus: 'cg'
					}
				]
			},
			{
				// UA.IV.A.K1 (load factor, stability, stalls)
				id: 'load-factor',
				title: 'Load factor & stalls',
				check: {
					q: 'When does the load factor on the airframe increase?',
					a: 'In turns and any maneuver other than straight-and-level flight.'
				},
				lines: [
					{
						text: 'When you maneuver, the structure carries more than its own weight. That is load factor.',
						focus: 'loadfactor'
					},
					{
						text: 'Any maneuver other than straight-and-level raises it — a steep, banked turn can make the wings support far more than the aircraft weighs.',
						focus: 'loadfactor'
					},
					{
						text: 'Push too hard and a fixed-wing exceeds its critical angle of attack and stalls — the smooth airflow breaks down and lift drops away. Fly smoothly.',
						focus: 'loadfactor'
					}
				]
			},
			{
				// UA.IV.A.K2, density altitude
				id: 'performance',
				title: 'Performance & conditions',
				check: {
					q: 'How does high density altitude affect performance?',
					a: 'Thinner air means less lift and thrust — reduced climb and payload.'
				},
				lines: [
					{
						text: 'Finally, conditions. Use the manufacturer’s performance data to know what your aircraft can actually do today.',
						focus: null
					},
					{
						text: 'High density altitude — hot, high, and humid — thins the air, so propellers make less thrust and you get less lift, less climb, and less payload.',
						focus: 'density'
					},
					{
						text: 'Wind, temperature, and a tired battery all cut into performance. Plan margins, keep a reserve, and do not fly to the edge.',
						focus: null
					}
				]
			}
		]
	}
];
