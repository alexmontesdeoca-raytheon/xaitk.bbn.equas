import SocketServer
import jsonpickle
    
    
class NlgDescription:
    """
    A generated natural-language description of an explanation, with per-phrase annotations
    """
    
    def __init__(self):
        """ A list of annotated phrases """
        self.annotatedText = []
        

""" Special ID meaning no neuron is referenced from this phrase """
NO_NEURON = -1


class NlgPhrase():
    """
    An element - one or more words - in a natural-language description of an
    explanation, possibly annotated with, for example, information about which
    neuron supports this element in the explanation.
    """
        
    def __init__(self, words="", neuronId=NO_NEURON):
        self.words = words
        self.neuronId = neuronId
        
        
class EquasNlgServer(SocketServer.StreamRequestHandler):
    """
    Server for EQUAS natural language generation.

    It is instantiated once per connection to the server, and 
    overrides the handle() method to implement communication to the
    client.
    """

    def handle(self):
        
        # get VQA answer and explanation data from server framework
        self.data = self.rfile.readline().strip()
        print "{} sent VQA data.  Raw JSON:".format(self.client_address[0])
        print self.data

        # Convert JSON text to nested dictionaries        
        vqaData = jsonpickle.decode(self.data)

        # Make our reply        
        reply = NlgDescription()

        # First part of explanation is just this prefix indicating the answer
        answer = vqaData["answer"]        
        prefix = NlgPhrase("It seems like the answer is '" + answer + "' because we see")
        reply.annotatedText.append(prefix)

        # Now, for this basic example, we simply append all the neuron data        
        neurons = vqaData["neurons"]
        numNeurons = len(neurons)        
        whichNeuron = 1
        for neuron in neurons:
            
            nlgEntry = NlgPhrase(neuron["label"], neuron["neuronId"])
            reply.annotatedText.append(nlgEntry)

            if whichNeuron < numNeurons:
                nlgEntry = NlgPhrase("and")
                reply.annotatedText.append(nlgEntry)                                        

            whichNeuron += 1
 
        # Convert our reply object to JSON        
        encodedReply = jsonpickle.encode(reply, unpicklable=False)
        print "Sending JSON-encoded reply: " + encodedReply
        
        # And, finally, send it back to server framework
        self.wfile.write(encodedReply)


if __name__ == "__main__":
    
    HOST, PORT = "0.0.0.0", 8089
    
    print "Creating and initializing NLG server on {}:{}...".format(HOST, PORT)

    # Create the server, binding to localhost on port 9999
    server = SocketServer.TCPServer((HOST, PORT), EquasNlgServer)

    print "NLG server init complete - starting server..."

    # Activate the server; this will keep running until you
    # interrupt the program with Ctrl-C
    server.serve_forever()

