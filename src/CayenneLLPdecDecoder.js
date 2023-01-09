function Decoder(bytes, port) {
  
    
    var sensor_types = {
        0  : {'size': 1, 'name': 'digital_in', 'signed': false, 'divisor': 1},
        1  : {'size': 1, 'name': 'digital_out', 'signed': false, 'divisor': 1},
        2  : {'size': 2, 'name': 'analog_in', 'signed': true , 'divisor': 100},
        3  : {'size': 2, 'name': 'analog_out', 'signed': true , 'divisor': 100},
        100: {'size': 4, 'name': 'generic', 'signed': false, 'divisor': 1},
        101: {'size': 2, 'name': 'illuminance', 'signed': false, 'divisor': 1},
        102: {'size': 1, 'name': 'presence', 'signed': false, 'divisor': 1},
        103: {'size': 2, 'name': 'temperature', 'signed': true , 'divisor': 10},
        104: {'size': 1, 'name': 'humidity', 'signed': false, 'divisor': 2},
        113: {'size': 6, 'name': 'accelerometer', 'signed': true , 'divisor': 1000},
        115: {'size': 2, 'name': 'barometer', 'signed': false, 'divisor': 10},
        116: {'size': 2, 'name': 'voltage', 'signed': false, 'divisor': 100},
        117: {'size': 2, 'name': 'current', 'signed': false, 'divisor': 1000},
        118: {'size': 4, 'name': 'frequency', 'signed': false, 'divisor': 1},
        120: {'size': 1, 'name': 'percentage', 'signed': false, 'divisor': 1},
        121: {'size': 2, 'name': 'altitude', 'signed': true, 'divisor': 1},
		125: {'size': 2, 'name': 'concentration', 'signed': false, 'divisor': 1},
        128: {'size': 2, 'name': 'power', 'signed': false, 'divisor': 1},
        130: {'size': 4, 'name': 'distance', 'signed': false, 'divisor': 1000},
        131: {'size': 4, 'name': 'energy', 'signed': false, 'divisor': 1000},
        132: {'size': 2, 'name': 'direction', 'signed': false, 'divisor': 1},
        133: {'size': 4, 'name': 'time', 'signed': false, 'divisor': 1},
        134: {'size': 6, 'name': 'gyrometer', 'signed': true , 'divisor': 100},
		135: {'size': 3, 'name': 'colour', 'signed': false, 'divisor': 1},
        136: {'size': 9, 'name': 'location', 'signed': true, 'divisor': [10000,10000,100]},
        142: {'size': 1, 'name': 'switch', 'signed': false, 'divisor': 1},
    };

    function arrayToDecimal(stream, is_signed, divisor) {

        var value = 0;
        for (var i = 0; i < stream.length; i++) {
            if (stream[i] > 0xFF)
                throw 'Byte value overflow!';
            value = (value << 8) | stream[i];
        }

        if (is_signed) {
            var edge = 1 << (stream.length) * 8;  // 0x1000..
            var max = (edge - 1) >> 1;             // 0x0FFF.. >> 1
            value = (value > max) ? value - edge : value;
        }

        value /= divisor;

        return value;

    }

    var sensors = [];
    var i = 0;
    while (i < bytes.length) {

        var s_no   = bytes[i++];
        var s_type = bytes[i++];
        if (typeof sensor_types[s_type] == 'undefined') {
            throw 'Sensor type error!: ' + s_type;
        }

        var s_value = 0;
        var type = sensor_types[s_type];
        switch (s_type) {

            case 113:   // Accelerometer
            case 134:   // Gyrometer
                var x = arrayToDecimal(bytes.slice(i+0, i+2), type.signed, type.divisor);
                var y = arrayToDecimal(bytes.slice(i+2, i+4), type.signed, type.divisor);
                var z = arrayToDecimal(bytes.slice(i+4, i+6), type.signed, type.divisor);
                s_value = "("+x+","+y+","+z+")";     
                break;
            
            case 136:   // GPS Location
                var latitude = arrayToDecimal(bytes.slice(i+0, i+3), type.signed, type.divisor[0]);
                var longitude = arrayToDecimal(bytes.slice(i+3, i+6), type.signed, type.divisor[1]);
                break;
			case 135:   // Colour
				s_value = {
                    'r': arrayToDecimal(bytes.slice(i+0, i+1), type.signed, type.divisor),
                    'g': arrayToDecimal(bytes.slice(i+1, i+2), type.signed, type.divisor),
                    'b': arrayToDecimal(bytes.slice(i+2, i+3), type.signed, type.divisor)
                };
                break;

            default:    // All the rest
                s_value = arrayToDecimal(bytes.slice(i, i + type.size), type.signed, type.divisor);
                break;
        }
        
        sensors.push({
            //'channel': s_no,
            //'type': s_type,
            'field': type.name,
            'value': s_value
        });

        i += type.size;

    }
    
  
    return sensors;
      
}
