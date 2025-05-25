import os
# decoding a message given by the user to put into the
# least significant bits.


# ask for the image
file_name = input("Please enter the file name/path you want to decode: ")


with open(file_name, 'rb') as file:
    image_bytes = bytearray(file.read())

#read the message size
bytes_to_read = image_bytes[0:4]


#read the # of LSB to decode
