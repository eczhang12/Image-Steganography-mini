import os
# encoding a message given by the user to put into the
# least significant bits.


# ask for the image
file_name = input("Please enter the file name/path you want to encode: ")

with open(file_name, 'rb') as file:
    image_bytes = bytearray(file.read())
file_size = os.path.getsize(file_name)

# ask for number of bits they want to change
changed_bits = int(input("How many of the Least Significant Bits do you want to change: "))

# Subtract 32 for the Int message size to be encoded as well
# Subtract another 32 for the # of LSB to change for easy decoding
max_message_size = int ((file_size * changed_bits - 64) / 8)

while True:
    message = input("Message to encode: ")
    if len(message) <= max_message_size:
        break
    else:
        print(f"Your message is too big! Maximum length is {max_message_size}. Please try again.")

# We have the message, we have the image file, time to start writing

message_size = len(message)

# message bits includes the message size at the beginning as well to be encoded
message_bits = format(message_size, '032b') + format(changed_bits, '032b')

# add convert the message into bits and add it to the message_bits
message_bits += ''.join(format(ord(c), '08b') for c in message)

#message_bits now include the entire bitstring to begin encoding

bit_index = 0
bit_mask = (1 << changed_bits) - 1
# go through every byte in the image
for i in range(len(image_bytes)):
    # stop going through every byte when we run out of message bits
    if bit_index >= len(message_bits):
        break

    #find bits to embed
    bits_to_embed = message_bits[bit_index : bit_index + changed_bits]

    #what happens when we run out of bits to embed? We need to pad the end
    # with 0s
    if len(bits_to_embed) < changed_bits:
        bits_to_embed = bits_to_embed.ljust(changed_bits, '0')
    
    byte = image_bytes[i]
    # Clear LSBs and set with message bits
    # have to cast to int because you can't OR with a string
    byte = (byte & ~bit_mask) | int(bits_to_embed, 2)
    image_bytes[i] = byte

    bit_index += changed_bits


encoded_filename = 'encoded_' + os.path.basename(file_name)
with open(encoded_filename, 'wb') as f:
    f.write(image_bytes)


print("Successfully encoded :)")